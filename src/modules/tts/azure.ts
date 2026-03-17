import { getPref, setPref } from "../utils/prefs";
import { notifyGeneric } from "../utils/notify";
import { getString } from "../utils/locale";

// Azure Voice API response type
interface AzureVoice {
    Locale: string;
    ShortName: string;
    SecondaryLocaleList?: string[];
}

// Ogg page structure for parsing and building
interface OggPage {
    capturePattern: string;           // "OggS"
    version: number;
    headerType: number;
    granulePosition: bigint;
    serialNumber: number;
    sequenceNumber: number;
    checksum: number;
    segments: number[];               // lacing values
    payload: Uint8Array;
}

// Text section splitter for handling long text synthesis
class TextSectionSplitter {
    private static readonly MAX_SECTION_SIZE = 6 * 1024; // 6K characters, ~8 mins, ~$0.1. Azure Speech has TTS audio duration limit of 10 minutes.

    private fullText: string = "";
    private currentIndex: number = 0;

    public initialize(text: string): void {
        this.fullText = text;
        this.currentIndex = 0;
    }

    public hasMore(): boolean {
        return this.currentIndex < this.fullText.length;
    }

    public getNextSection(): string {
        if (!this.hasMore()) {
            return "";
        }

        const sectionEnd = this.findSectionEnd(this.currentIndex);
        const section = this.fullText.substring(this.currentIndex, sectionEnd);
        this.currentIndex = sectionEnd;

        return section;
    }

    public reset(): void {
        this.fullText = "";
        this.currentIndex = 0;
    }

    private findSectionEnd(startIndex: number): number {
        const remaining = this.fullText.length - startIndex;
        if (remaining <= TextSectionSplitter.MAX_SECTION_SIZE) {
            return this.fullText.length;
        }

        // Search backwards from threshold position
        const searchEnd = startIndex + TextSectionSplitter.MAX_SECTION_SIZE;
        const searchText = this.fullText.substring(startIndex, searchEnd);
        const minSearchPos = Math.floor(TextSectionSplitter.MAX_SECTION_SIZE * 0.5);

        // Priority: paragraph boundary > line+indent > punctuation > single line > tab
        // TODO: Tune break patterns
        const breakPatterns = [
            /\n\n/g,    // Paragraph separator
            /\n\t/g,    // Line break + tab (likely paragraph start)
            /\n /g,     // Line break + space (possible paragraph start)
            /:\s/g,     // Colon + whitespace (break after colon)
            /;\s/g,     // Semicolon + whitespace (break after semicolon)
            /\n/g,      // Single line break
            /\t/g,      // Tab character
        ];

        for (const pattern of breakPatterns) {
            let lastMatch: RegExpExecArray | null = null;
            let match: RegExpExecArray | null;

            // Reset regex lastIndex
            pattern.lastIndex = 0;

            // Find all matches and keep the last one that's after minSearchPos
            while ((match = pattern.exec(searchText)) !== null) {
                if (match.index > minSearchPos) {
                    lastMatch = match;
                }
            }

            if (lastMatch) {
                const sectionEnd = startIndex + lastMatch.index + lastMatch[0].length;

                // Log split preview if there's more text after this section
                if (sectionEnd < this.fullText.length) {
                    const previewBefore = this.fullText.substring(Math.max(0, sectionEnd - 30), sectionEnd);
                    const previewAfter = this.fullText.substring(sectionEnd, Math.min(this.fullText.length, sectionEnd + 30));
                    ztoolkit.log(`Split at pattern "${lastMatch[0]}": ...${previewBefore} | ${previewAfter}...`);
                }

                return sectionEnd;
            }
        }

        // No suitable break point found, force split at threshold
        const previewBefore = this.fullText.substring(Math.max(0, searchEnd - 30), searchEnd);
        const previewAfter = this.fullText.substring(searchEnd, Math.min(this.fullText.length, searchEnd + 30));
        ztoolkit.log(`No suitable break point found, forcing split at ${TextSectionSplitter.MAX_SECTION_SIZE}: ...${previewBefore} | ${previewAfter}...`);

        return searchEnd;
    }
}

// Ogg/Opus stream segmenter for generating playable segments
class OggSegmenter {
    private static readonly CRC_POLYNOMIAL = 0xEDB88320;

    // State - Parsing
    private parseBuffer: Uint8Array = new Uint8Array(0);
    private headersParsed: boolean = false;

    // State - Header pages
    private opusHeadPage: Uint8Array | null = null;
    private opusTagsPage: Uint8Array | null = null;

    // State - Stream info
    private serialNumber: number = 0;
    private currentGranulePosition: bigint = 0n;
    private nextPageSequence: number = 0;

    // Public methods
    public processChunk(chunk: Uint8Array): Uint8Array | null {
        if (this.headersParsed) {
            // Headers already extracted, return chunk as-is
            return chunk;
        }

        // Append chunk to buffer
        const buffer = this.appendToBuffer(chunk);

        let offset = 0;
        while (offset < buffer.length) {
            // Try to parse a complete page at current offset
            const result = this.tryParsePageAt(buffer, offset);

            if (!result.complete) {
                // Page is incomplete, save remaining data for next chunk
                this.parseBuffer = buffer.slice(offset);
                return null;
            }

            // Successfully parsed a complete page
            const { page, totalBytes } = result;

            if (this.isOpusHead(page!.payload)) {
                // Save OpusHead page
                this.opusHeadPage = buffer.slice(offset, offset + totalBytes!);
                this.serialNumber = page!.serialNumber;
                ztoolkit.log(`Extracted OpusHead page: ${totalBytes} bytes, serial=${this.serialNumber}`);
            } else if (this.isOpusTags(page!.payload)) {
                // Save OpusTags page
                this.opusTagsPage = buffer.slice(offset, offset + totalBytes!);
                this.headersParsed = true;
                ztoolkit.log(`Extracted OpusTags page: ${totalBytes} bytes`);

                // Headers complete, return remaining data if any
                offset += totalBytes!;
                this.parseBuffer = new Uint8Array(0);

                if (offset < buffer.length) {
                    const remaining = buffer.slice(offset);
                    ztoolkit.log(`Headers complete, returning ${remaining.length} bytes of audio data`);
                    return remaining;
                }
                return null;
            }

            offset += totalBytes!;
        }

        // All data processed but headers not complete yet
        this.parseBuffer = new Uint8Array(0);
        return null;
    }

    public isHeadersParsed(): boolean {
        return this.headersParsed;
    }

    public createSegment(chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
        // Validate headers are available
        if (!this.opusHeadPage || !this.opusTagsPage) {
            ztoolkit.log('Error: Cannot create segment without headers');
            return new Uint8Array(0);
        }

        // Calculate total audio size
        const totalAudioSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

        // Concatenate all audio chunks
        const audioData = new Uint8Array(totalAudioSize);
        let offset = 0;
        for (const chunk of chunks) {
            audioData.set(chunk, offset);
            offset += chunk.length;
        }

        // Estimate granule position (simplified: assume ~960 samples per 20ms frame)
        // This is a rough estimate; proper implementation would parse Opus TOC
        const estimatedFrames = Math.floor(audioData.length / 100); // Very rough estimate
        this.currentGranulePosition += BigInt(estimatedFrames * 960);

        // Build audio page with current granule position
        const audioPage = this.buildOggPage({
            headerType: 0x00, // Continued page
            granulePosition: this.currentGranulePosition,
            serialNumber: this.serialNumber,
            sequenceNumber: this.nextPageSequence++,
            payload: audioData
        });

        // Calculate segment size and allocate buffer
        const segmentSize = this.opusHeadPage.length + this.opusTagsPage.length + audioPage.length;
        const segment = new Uint8Array(segmentSize);

        // Combine: OpusHead + OpusTags + Audio
        segment.set(this.opusHeadPage, 0);
        segment.set(this.opusTagsPage, this.opusHeadPage.length);
        segment.set(audioPage, this.opusHeadPage.length + this.opusTagsPage.length);

        ztoolkit.log(`Created segment: ${segment.length} bytes (head=${this.opusHeadPage.length}, tags=${this.opusTagsPage.length}, audio=${audioPage.length})`);

        return segment;
    }

    public reset(): void {
        this.parseBuffer = new Uint8Array(0);
        this.headersParsed = false;
        this.opusHeadPage = null;
        this.opusTagsPage = null;
        this.serialNumber = 0;
        this.currentGranulePosition = 0n;
        this.nextPageSequence = 0;
    }

    // Private parsing methods
    private appendToBuffer(chunk: Uint8Array): Uint8Array {
        if (this.parseBuffer.length === 0) {
            return chunk;
        }
        const combined = new Uint8Array(this.parseBuffer.length + chunk.length);
        combined.set(this.parseBuffer, 0);
        combined.set(chunk, this.parseBuffer.length);
        return combined;
    }

    private tryParsePageAt(buffer: Uint8Array, offset: number): { complete: boolean; page?: OggPage; totalBytes?: number } {
        // Check if we have at least the header (27 bytes)
        if (buffer.length - offset < 27) {
            return { complete: false };
        }

        // Verify capture pattern "OggS"
        const capturePattern = new TextDecoder().decode(buffer.slice(offset, offset + 4));
        if (capturePattern !== 'OggS') {
            ztoolkit.log(`Invalid Ogg page: expected "OggS", got "${capturePattern}"`);
            return { complete: false };
        }

        // Create DataView for reading multi-byte fields
        const view = new DataView(buffer.buffer, buffer.byteOffset + offset, buffer.length - offset);

        // Extract header fields
        const version = buffer[offset + 4];
        const headerType = buffer[offset + 5];
        const granulePosition = view.getBigUint64(6, true);  // little-endian
        const serialNumber = view.getUint32(14, true);
        const sequenceNumber = view.getUint32(18, true);
        const checksum = view.getUint32(22, true);
        const segmentCount = buffer[offset + 26];

        // Check if we have the segment table
        if (buffer.length - offset < 27 + segmentCount) {
            return { complete: false };
        }

        // Read segment table (lacing values) and calculate payload size
        const segments: number[] = [];
        let payloadSize = 0;
        for (let i = 0; i < segmentCount; i++) {
            const lacingValue = buffer[offset + 27 + i];
            segments.push(lacingValue);
            payloadSize += lacingValue;
        }

        // Calculate sizes
        const headerAndTableSize = 27 + segmentCount;
        const totalSize = headerAndTableSize + payloadSize;

        // Check if we have the complete payload
        if (buffer.length - offset < totalSize) {
            return { complete: false };
        }

        // Extract payload
        const payload = buffer.slice(offset + headerAndTableSize, offset + totalSize);

        // Build OggPage object
        const page: OggPage = {
            capturePattern,
            version,
            headerType,
            granulePosition,
            serialNumber,
            sequenceNumber,
            checksum,
            segments,
            payload
        };

        return { complete: true, page, totalBytes: totalSize };
    }

    private isOpusHead(payload: Uint8Array): boolean {
        if (payload.length < 8) return false;
        const magic = new TextDecoder().decode(payload.slice(0, 8));
        return magic === 'OpusHead';
    }

    private isOpusTags(payload: Uint8Array): boolean {
        if (payload.length < 8) return false;
        const magic = new TextDecoder().decode(payload.slice(0, 8));
        return magic === 'OpusTags';
    }

    // Private building methods
    private buildOggPage(params: {
        headerType: number;
        granulePosition: bigint;
        serialNumber: number;
        sequenceNumber: number;
        payload: Uint8Array;
    }): Uint8Array {
        // Destructure parameters
        const { headerType, granulePosition, serialNumber, sequenceNumber, payload } = params;

        // Build segment table (lacing values)
        const segments: number[] = [];
        let remaining = payload.length;
        while (remaining > 0) {
            if (remaining >= 255) {
                segments.push(255);
                remaining -= 255;
            } else {
                segments.push(remaining);
                remaining = 0;
            }
        }

        // Calculate sizes
        const segmentCount = segments.length;
        const headerSize = 27 + segmentCount;
        const totalSize = headerSize + payload.length;

        // Allocate buffer
        const page = new Uint8Array(totalSize);
        const view = new DataView(page.buffer);

        // Write capture pattern "OggS"
        page[0] = 0x4f; // 'O'
        page[1] = 0x67; // 'g'
        page[2] = 0x67; // 'g'
        page[3] = 0x53; // 'S'

        // Write version (0)
        page[4] = 0;

        // Write header type
        page[5] = headerType;

        // Write granule position (8 bytes, little-endian)
        view.setBigUint64(6, granulePosition, true);

        // Write serial number (4 bytes, little-endian)
        view.setUint32(14, serialNumber, true);

        // Write sequence number (4 bytes, little-endian)
        view.setUint32(18, sequenceNumber, true);

        // Write checksum (placeholder, will calculate later)
        view.setUint32(22, 0, true);

        // Write segment count
        page[26] = segmentCount;

        // Write segment table
        for (let i = 0; i < segmentCount; i++) {
            page[27 + i] = segments[i];
        }

        // Write payload
        page.set(payload, headerSize);

        // Calculate and write CRC32
        const crc = this.calculateCRC32(page);
        view.setUint32(22, crc, true);

        return page;
    }

    // Private utility methods
    private calculateCRC32(data: Uint8Array): number {
        let crc = 0;
        for (let i = 0; i < data.length; i++) {
            crc = crc ^ data[i];
            for (let j = 0; j < 8; j++) {
                if (crc & 1) {
                    crc = (crc >>> 1) ^ OggSegmenter.CRC_POLYNOMIAL;
                } else {
                    crc = crc >>> 1;
                }
            }
        }
        return crc >>> 0; // Convert to unsigned 32-bit
    }
}

// Audio player class for handling Ogg/Opus playback
class AudioPlayer {
    private readonly oggSegmenter: OggSegmenter;

    private audioElement: HTMLAudioElement | null = null;
    private audioQueue: Uint8Array[] = [];
    private isPlaying: boolean = false;
    private isPaused: boolean = false;
    private isInitialized: boolean = false;
    private isSynthesisComplete: boolean = false;
    private headersExtracted: boolean = false;
    private onAllSegmentsComplete?: () => void;

    private _minSegmentSize: number = 8 * 1024;

    constructor() {
        this.oggSegmenter = new OggSegmenter();
    }

    public get minSegmentSize(): number {
        return this._minSegmentSize;
    }

    public set minSegmentSize(size: number) {
        this._minSegmentSize = size;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        this.audioElement = new window.Audio();
        this.audioElement.autoplay = false;

        // For Ogg/Opus, we can use direct blob URLs instead of MediaSource
        // since Firefox natively supports Ogg/Opus
        this.isInitialized = true;
    }

    public setOnCompleteCallback(callback: () => void): void {
        this.onAllSegmentsComplete = callback;
    }

    public async queueAudioChunk(audioData: Uint8Array): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.headersExtracted) {
            // Process chunk for header extraction
            const remainingData = this.oggSegmenter.processChunk(audioData);

            if (this.oggSegmenter.isHeadersParsed()) {
                this.headersExtracted = true;
                ztoolkit.log('Ogg headers extracted, starting streaming playback');

                // If there's remaining audio data after headers, queue it
                if (remainingData && remainingData.length > 0) {
                    this.audioQueue.push(remainingData);
                    ztoolkit.log(`Queued ${remainingData.length} bytes of audio data after headers`);
                }

                // Try to start playback
                await this.tryPlayNextSegment();
            }
            return;
        }

        // Headers already extracted, queue normally
        this.audioQueue.push(audioData);
        //ztoolkit.log(`Received audio chunk: ${audioData.length} bytes, queue size: ${this.audioQueue.reduce((sum, chunk) => sum + chunk.length, 0)} bytes`);

        await this.tryPlayNextSegment();
    }

    public async onSynthesisComplete(): Promise<void> {
        // Mark synthesis as complete and trigger final segment playback
        this.isSynthesisComplete = true;
        ztoolkit.log(`onSynthesisComplete: queue size=${this.audioQueue.reduce((sum, chunk) => sum + chunk.length, 0)} bytes`);
        await this.tryPlayNextSegment();
    }

    public pause(): void {
        if (this.audioElement && this.isPlaying) {
            this.audioElement.pause();
            this.isPaused = true;
            addon.data.tts.state = "paused";
        }
    }

    public resume(): void {
        if (this.audioElement && this.isPaused) {
            this.audioElement.play();
            this.isPaused = false;
            addon.data.tts.state = "playing";
        }
    }

    public stop(): void {
        this.resetAudioState();
        this.isPaused = false;
        addon.data.tts.state = "idle";
    }

    public prepareForNewSection(): void {
        // Reset audio state for new section synthesis without changing global state
        this.resetAudioState();
    }

    public dispose(): void {
        this.stop();
        this.audioElement = null;
        this.isInitialized = false;
    }

    private resetAudioState(): void {
        this.audioQueue = [];
        this.isPlaying = false;
        this.isSynthesisComplete = false;
        this.headersExtracted = false;
        this.oggSegmenter.reset();

        if (this.audioElement && this.audioElement.src) {
            if (!this.audioElement.paused) {
                this.audioElement.pause();
            }
            if (this.audioElement.src.startsWith("blob:")) {
                URL.revokeObjectURL(this.audioElement.src);
            }
            this.audioElement.removeAttribute("src");
            this.audioElement.load();
        }
    }

    private async tryPlayNextSegment(): Promise<void> {
        // Don't start new playback if already playing or paused
        if (this.isPlaying || this.isPaused || this.audioQueue.length === 0) {
            return;
        }

        const queuedSize = this.audioQueue.reduce((sum, chunk) => sum + chunk.length, 0);

        // Calculate remaining size after taking one segment
        const remainingSize = queuedSize - this.minSegmentSize;

        // Determine if we should play
        let shouldPlay = false;

        if (this.isSynthesisComplete) {
            // Synthesis is complete
            if (queuedSize > 0) {
                if (queuedSize < this.minSegmentSize) {
                    // Edge case: less than minimum, log warning and play all
                    ztoolkit.log(`Warning: Final segment is only ${queuedSize} bytes (< ${this.minSegmentSize}), playing anyway`);
                    shouldPlay = true;
                } else if (remainingSize < this.minSegmentSize) {
                    // Edge case: between 1x-2x threshold, play all together
                    ztoolkit.log(`Final segment is ${queuedSize} bytes, playing all together`);
                    shouldPlay = true;
                } else {
                    // Normal case: enough data for a segment
                    shouldPlay = true;
                }
            }
        } else {
            // Synthesis not complete, only play if we have enough buffer
            if (queuedSize >= this.minSegmentSize && remainingSize >= this.minSegmentSize) {
                shouldPlay = true;
            }
        }

        if (shouldPlay) {
            await this.playSegment();
        }
    }

    private async playSegment(): Promise<void> {
        // Early return if conditions not met
        if (this.audioQueue.length === 0 || this.isPaused || this.isPlaying) {
            return;
        }

        this.isPlaying = true;

        // Calculate queue sizes for decision making
        const queuedSize = this.audioQueue.reduce((sum, chunk) => sum + chunk.length, 0);
        const remainingSize = queuedSize - this.minSegmentSize;

        // Determine which chunks to play
        const chunksToPlay: Uint8Array[] = (this.isSynthesisComplete || remainingSize < this.minSegmentSize)
            ? // Play all remaining chunks if synthesis is complete or remaining would be too small
              (this.audioQueue.splice(0, this.audioQueue.length))
            : // Play chunks until we have at least minSegmentSize
              (() => {
                  let segmentSize = 0;
                  let chunkCount = 0;
                  for (const chunk of this.audioQueue) {
                      segmentSize += chunk.length;
                      chunkCount++;
                      if (segmentSize >= this.minSegmentSize) {
                          break;
                      }
                  }
                  return this.audioQueue.splice(0, chunkCount);
              })();

        // Log playback details
        const totalLength = chunksToPlay.reduce((sum, chunk) => sum + chunk.length, 0);
        ztoolkit.log(`playSegment() starting: ${totalLength} bytes from ${chunksToPlay.length} chunks, ${this.audioQueue.length} chunks remaining`);

        // Create complete Ogg segment with headers
        const segment = this.oggSegmenter.createSegment(chunksToPlay);

        // Create blob and URL for playback
        const blob = new Blob([segment], { type: "audio/ogg; codecs=opus" });
        const url = URL.createObjectURL(blob);

        if (this.audioElement) {
            this.audioElement.src = url;
            this.audioElement.volume = (getPref("azure.volume") as number) / 100;
            this.audioElement.playbackRate = (getPref("azure.rate") as number) / 100;

            const playPromise = this.audioElement.play();

            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    ztoolkit.log(`Audio playback error: ${error}`);
                    this.isPlaying = false;
                    URL.revokeObjectURL(url);
                });
            }

            // When segment finishes, try to play next segment
            this.audioElement.onended = async () => {
                URL.revokeObjectURL(url);
                this.isPlaying = false;

                // Check if there are more segments to play
                if (this.audioQueue.length > 0 || !this.isSynthesisComplete) {
                    await this.tryPlayNextSegment();
                } else {
                    // All audio segments done
                    if (this.onAllSegmentsComplete) {
                        this.onAllSegmentsComplete();
                    } else {
                        addon.data.tts.state = "idle";
                    }
                }
            };
        }
    }
}

// WebSocket v2 connection manager for Azure Speech
class AzureStreamingSynthesizer {
    private static readonly TURN_START_TIMEOUT = 5000;

    private ws: WebSocket | null = null;
    private requestId: string = "";
    private audioPlayer: AudioPlayer;
    private textSplitter: TextSectionSplitter;
    private isConnected: boolean = false;
    private isStopped: boolean = false;
    private turnStartResolve: (() => void) | null = null;
    private turnStartReject: ((reason?: unknown) => void) | null = null;

    constructor() {
        this.audioPlayer = new AudioPlayer();
        this.textSplitter = new TextSectionSplitter();
        this.audioPlayer.setOnCompleteCallback(() => this.onAudioComplete());
    }

    public async connect(): Promise<void> {
        if (this.isConnected && this.ws && this.ws.readyState === window.WebSocket.OPEN) {
            return;
        }

        const { key: subscriptionKey, region } = getAzureConfig();

        if (!subscriptionKey || !region) {
            throw new Error("auth-failed");
        }

        this.requestId = this.generateGuid();
        const connectionId = this.generateGuid();

        // Build WebSocket URL
        let wsUrl = `wss://${region}.tts.speech.microsoft.com/cognitiveservices/websocket/v2`;
        wsUrl += `?ConnectionId=${connectionId}`;
        wsUrl += `&X-ConnectionId=${connectionId}`;

        // Add subscription key to URL if provided
        if (subscriptionKey) {
            wsUrl += `&Ocp-Apim-Subscription-Key=${encodeURIComponent(subscriptionKey)}`;
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new window.WebSocket(wsUrl);
                this.ws.binaryType = "arraybuffer";

                this.ws.onopen = () => {
                    this.isConnected = true;
                    resolve();
                };

                this.ws.onmessage = async (event) => {
                    await this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    ztoolkit.log(`WebSocket error: ${error}`);
                    if (!this.isConnected) {
                        reject(new Error("connection-failed"));
                    }
                };

                this.ws.onclose = (event) => {
                    const wasConnected = this.isConnected;
                    this.isConnected = false;
                    // Only notify if connection was previously established and then dropped
                    // Connection failures are handled by speak().catch()
                    if (event.code !== 1000 && !this.isStopped && wasConnected) {
                        ztoolkit.log(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`);
                        notifyGeneric(
                            [getString("popup-engineErrorTitle", { args: { engine: "azure" } }),
                             getString("popup-engineErrorCause", { args: { engine: "azure", cause: "connection-closed" } })],
                            "error"
                        );
                    }
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    public async speak(text: string): Promise<void> {
        // Stop any previous playback
        if (this.audioPlayer) {
            this.audioPlayer.stop();
        }

        // Initialize text section splitting
        this.textSplitter.initialize(text);
        this.isStopped = false;

        // Get first section
        const firstSection = this.textSplitter.getNextSection();
        ztoolkit.log(`Azure speak: total ${text.length} chars, first section ${firstSection.length} chars, hasMore: ${this.textSplitter.hasMore()}`);

        // Synthesize first section
        await this.speakSection(firstSection);

        // Check if stopped during synthesis
        if (this.isStopped) {
            return;
        }
    }

    private async speakSection(sectionText: string): Promise<void> {
        // Early return if stopped
        if (this.isStopped) {
            return;
        }

        // Prepare audio player for new section synthesis
        this.audioPlayer.prepareForNewSection();

        // Read configuration from preferences
        const languageId = (getPref("azure.language") as string || "").trim();
        const voiceName = (getPref("azure.voice") as string || "").trim();
        const minSegmentSizeKB = getPref("azure.minSegmentSize") as number || 8;
        this.audioPlayer.minSegmentSize = minSegmentSizeKB * 1024;

        if (!languageId || !voiceName) {
            ztoolkit.log(`Azure TTS configuration incomplete: language="${languageId}", voice="${voiceName}"`);
            throw new Error("config-incomplete");
        }

        // Generate new requestId for each section
        this.requestId = this.generateGuid();

        await this.connect();

        // Check if stopped after connection
        if (this.isStopped) {
            return;
        }

        await this.audioPlayer.initialize();

        // Send speech.config
        const configMessage = this.buildMessage('speech.config', {});
        this.ws?.send(configMessage);

        // Send synthesis.context
        const contextMessage = this.buildMessage('synthesis.context', {
            synthesis: {
                audio: {
                    metadataOptions: {
                        sentenceBoundaryEnabled: false,
                        wordBoundaryEnabled: false,
                        visemeEnabled: false,
                        bookmarkEnabled: false,
                        punctuationBoundaryEnabled: false,
                        sessionEndEnabled: true
                    },
                    outputFormat: 'ogg-24khz-16bit-mono-opus'
                },
                language: {
                    autoDetection: false
                },
                input: {
                    bidirectionalStreamingMode: true,
                    voiceName: voiceName,
                    language: languageId
                }
            }
        });

        // Wait for turn.start response
        const turnStartPromise = new Promise<void>((resolve, reject) => {
            this.turnStartResolve = resolve;
            this.turnStartReject = reject;
        });

        this.ws?.send(contextMessage);

        try {
            await Promise.race([
                turnStartPromise,
                new Promise<void>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout waiting for turn.start")), AzureStreamingSynthesizer.TURN_START_TIMEOUT)
                )
            ]);

            // Check if cancelled during wait
            if (this.isStopped) {
                ztoolkit.log("Synthesis cancelled while waiting for turn.start");
                return;
            }
        } catch (error) {
            ztoolkit.log(`Error waiting for turn.start: ${error}`);
            throw error;
        }

        // Check if stopped after waiting for turn.start
        if (this.isStopped) {
            return;
        }

        // Send section text
        ztoolkit.log(`Sending section text: ${sectionText.length} characters`);
        addon.data.tts.state = "playing";

        const textMessage = this.buildMessage('text.piece', sectionText, 'text/plain');
        this.ws?.send(textMessage);

        // Immediately send text.end to signal completion
        const endMessage = this.buildMessage('text.end', '', 'text/plain');
        this.ws?.send(endMessage);

        ztoolkit.log(`Section text sent, waiting for audio synthesis to complete`);
    }

    public stop(): void {
        this.isStopped = true;

        // Interrupt waiting for turn.start if in progress
        if (this.turnStartReject) {
            this.turnStartReject(new Error("Cancelled by user"));
            this.turnStartReject = null;
            this.turnStartResolve = null;
        }

        this.textSplitter.reset();
        this.audioPlayer.stop();
        addon.data.tts.state = "idle";
    }

    public pause(): void {
        this.audioPlayer.pause();
    }

    public resume(): void {
        this.audioPlayer.resume();
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close(1000, "Normal closure");
            this.ws = null;
        }
        this.isConnected = false;
    }

    public dispose(): void {
        this.stop();
        this.disconnect();
        this.audioPlayer.dispose();
    }

    private async onAudioComplete(): Promise<void> {
        // Early return if stopped
        if (this.isStopped) {
            this.textSplitter.reset();
            addon.data.tts.state = "idle";
            return;
        }

        // Check if there are more text sections to synthesize
        if (this.textSplitter.hasMore()) {
            const nextSection = this.textSplitter.getNextSection();
            ztoolkit.log(`Continuing with next section: ${nextSection.length} chars, hasMore: ${this.textSplitter.hasMore()}`);

            try {
                await this.speakSection(nextSection);
            } catch (error) {
                ztoolkit.log(`Error synthesizing section: ${error}`);
                this.textSplitter.reset();
                addon.data.tts.state = "idle";
            }
        } else {
            // All text sections completed
            ztoolkit.log('All text sections completed');
            this.textSplitter.reset();
            addon.data.tts.state = "idle";
        }
    }

    private generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private generateTimestamp(): string {
        return new Date().toISOString();
    }

    private buildMessage(path: string, body: string | Record<string, unknown>, contentType: string = 'application/json'): string {
        const timestamp = this.generateTimestamp();
        const headers = [
            `X-Timestamp:${timestamp}`,
            `X-RequestId:${this.requestId}`,
            `Path:${path}`,
            `Content-Type:${contentType}`,
            '',
            ''
        ];

        // For text/plain messages, body is already a string; for JSON messages, stringify it
        const content = contentType === 'text/plain' ? body : JSON.stringify(body);
        return headers.join('\r\n') + content;
    }

    private async handleMessage(data: ArrayBuffer | string): Promise<void> {
        if (typeof data === 'string') {
            // Parse text message headers
            const headerEnd = data.indexOf('\r\n\r\n');
            if (headerEnd === -1) {
                return;
            }

            const headerText = data.substring(0, headerEnd);
            const lines = headerText.split('\r\n');

            // Extract Path header
            let path = '';
            for (const line of lines) {
                if (line.startsWith('Path:')) {
                    path = line.substring(5).trim();
                    break;
                }
            }

            // Process based on path
            if (path === 'turn.start') {
                ztoolkit.log('turn.start received');
                if (this.turnStartResolve) {
                    this.turnStartResolve();
                    this.turnStartResolve = null;
                    this.turnStartReject = null;
                }
            } else if (path === 'turn.end') {
                ztoolkit.log(`turn.end received`);
                // Mark synthesis as complete and trigger final playback
                await this.audioPlayer.onSynthesisComplete();
            } else if (path === 'response') {
                // Ignore response messages
            } else {
                // Log unknown message types
                ztoolkit.log(`Unknown text message: Path=${path}`);
            }

            return;
        }

        // Binary message - Azure uses 2-byte length prefix for headers
        const view = new Uint8Array(data);

        // Validate minimum length
        if (view.length < 2) {
            ztoolkit.log(`Binary message too short: ${view.length} bytes`);
            return;
        }

        // Read header length (big-endian)
        const headerLength = (view[0] << 8) | view[1];

        // Validate complete message
        if (view.length < 2 + headerLength) {
            ztoolkit.log(`Binary message incomplete: expected ${2 + headerLength} bytes, got ${view.length}`);
            return;
        }

        // Extract and parse headers
        const headerBytes = view.slice(2, 2 + headerLength);
        const headerText = new TextDecoder('utf-8').decode(headerBytes);
        const headers = this.parseHeaders(headerText);

        // Process based on path
        if (headers['Path'] === 'audio') {
            // Extract audio data after header
            const audioData = view.slice(2 + headerLength);

            if (audioData.length > 0) {
                //ztoolkit.log(`Received audio chunk: ${audioData.length} bytes`);
                try {
                    await this.audioPlayer.queueAudioChunk(audioData);
                } catch (error) {
                    ztoolkit.log(`Error queueing audio chunk: ${error}`);
                }
            }
        } else if (headers['Path'] === 'response') {
            // Extract and log response metadata
            const bodyStart = 2 + headerLength;
            if (bodyStart < view.length) {
                const bodyText = new TextDecoder('utf-8').decode(view.slice(bodyStart));
                ztoolkit.log(`Response: ${bodyText}`);
            }
        }
    }

    private parseHeaders(headerText: string): { [key: string]: string } {
        const headers: { [key: string]: string } = {};
        const lines = headerText.split('\r\n');

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                headers[key] = value;
            }
        }

        return headers;
    }
}

// Singleton instance management
let synthesizer: AzureStreamingSynthesizer | null = null;

function getSynthesizer(): AzureStreamingSynthesizer {
    if (!synthesizer) {
        synthesizer = new AzureStreamingSynthesizer();
    }
    return synthesizer;
}

function setDefaultPrefs(): void {
    if (!getPref("azure.subscriptionKey")) {
        setPref("azure.subscriptionKey", "");
    }

    if (!getPref("azure.region")) {
        setPref("azure.region", "");
    }

    if (!getPref("azure.language")) {
        setPref("azure.language", "en-US");
    }

    // No default voice - user must select after fetching from API
}

async function initEngine(): Promise<void> {
    // Azure engine initialization always succeeds
    // Actual validation happens when user tries to speak
    // This allows users to configure the engine after installation
    return Promise.resolve();
}

// Get Azure configuration from environment variables and preferences
// Preferences override environment variables
function getAzureConfig(): { key: string; region: string } {
    let subscriptionKey = "";
    let region = "";

    // Try environment variables first
    try {
        // @ts-ignore - nsIEnvironment not in type definitions
        const env = Components.classes["@mozilla.org/process/environment;1"]
            .getService(Components.interfaces.nsIEnvironment);
        if (env.exists("AZURE_SPEECH_KEY")) {
            subscriptionKey = env.get("AZURE_SPEECH_KEY");
        }
        if (env.exists("AZURE_SPEECH_REGION")) {
            region = env.get("AZURE_SPEECH_REGION");
        }
    } catch (error) {
        ztoolkit.log(`Failed to read Azure environment variables: ${error}`);
    }

    // Preferences override environment variables
    const prefKey = (getPref("azure.subscriptionKey") as string || "").trim();
    if (prefKey) {
        subscriptionKey = prefKey;
    }

    const prefRegion = (getPref("azure.region") as string || "").trim();
    if (prefRegion) {
        region = prefRegion;
    }

    return {
        key: subscriptionKey.trim(),
        region: region.trim().toLowerCase()
    };
}

// Exported functions matching webSpeech.ts pattern
function speak(text: string): void {
    const synth = getSynthesizer();

    synth.speak(text).catch((error) => {
        ztoolkit.log(`Azure TTS error: ${error}`);

        let errorKey = "other";
        if (error.message === "config-incomplete") {
            errorKey = "config-incomplete";
        } else if (error.message === "auth-failed") {
            errorKey = "auth-failed";
        } else if (error.message === "connection-failed") {
            errorKey = "connection-failed";
        }

        notifyGeneric(
            [getString("popup-engineErrorTitle", { args: { engine: "azure" } }),
             getString("popup-engineErrorCause", { args: { engine: "azure", cause: errorKey } })],
            "error"
        );

        addon.data.tts.state = "idle";
    });
}

function stop(): void {
    if (synthesizer) {
        synthesizer.stop();
    }
}

function pause(): void {
    if (synthesizer) {
        synthesizer.pause();
    }
}

function resume(): void {
    if (synthesizer) {
        synthesizer.resume();
    }
}

function resetConnection(): void {
    if (synthesizer) {
        synthesizer.disconnect();
    }
}

function dispose(): void {
    if (synthesizer) {
        synthesizer.dispose();
        synthesizer = null;
    }
}

// Extras for preferences UI
async function getAllVoices(): Promise<{ success: boolean; voices: AzureVoice[] }> {
    const { key: subscriptionKey, region } = getAzureConfig();

    if (!subscriptionKey || !region) {
        ztoolkit.log("No subscription key or region available");
        return { success: false, voices: [] };
    }

    try {
        const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey
            }
        });

        if (!response.ok) {
            ztoolkit.log(`Failed to fetch voices: ${response.status} ${response.statusText}`);
            return { success: false, voices: [] };
        }

        const voices = await response.json();

        if (!Array.isArray(voices)) {
            ztoolkit.log("Invalid response format from Azure voices API");
            return { success: false, voices: [] };
        }

        return { success: true, voices: voices };

    } catch (error) {
        ztoolkit.log(`Error fetching voices from Azure: ${error}\n  URL: https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list\n  Region: ${region}\n  Key length: ${subscriptionKey.length}`);
        return { success: false, voices: [] };
    }
}

function extractLanguages(voices: AzureVoice[]): string[] {
    const languageSet = new Set<string>();

    voices.forEach(voice => {
        if (voice.Locale) {
            languageSet.add(voice.Locale);
        }

        if (voice.SecondaryLocaleList && Array.isArray(voice.SecondaryLocaleList)) {
            voice.SecondaryLocaleList.forEach((lang: string) => {
                languageSet.add(lang);
            });
        }
    });

    return Array.from(languageSet).sort();
}

function filterVoicesByLanguage(voices: AzureVoice[], language: string): string[] {
    const filtered = voices.filter(voice => {
        if (voice.Locale === language) {
            return true;
        }

        if (voice.SecondaryLocaleList && Array.isArray(voice.SecondaryLocaleList)) {
            return voice.SecondaryLocaleList.includes(language);
        }

        return false;
    });

    return filtered
        .map(voice => voice.ShortName)
        .filter(name => name) // Filter out any undefined/null
        .sort();
}

export {
    // Lifecycle
    setDefaultPrefs,
    initEngine,

    // TTS Operations
    speak,
    stop,
    pause,
    resume,

    // Connection & Resource Management
    resetConnection,
    dispose,

    // Configuration & Utilities
    getAzureConfig,
    getAllVoices,
    extractLanguages,
    filterVoicesByLanguage
};
