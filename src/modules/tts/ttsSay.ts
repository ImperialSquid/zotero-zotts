import {ttsBase} from "./ttsBase";
const say = require("say");

const VOICES_UNAVAILABLE = "Voice selection unavailable";

export class ttsSay extends ttsBase{
    protected canPause: boolean;
    protected voices: Array<string>;
    private voice: string;
    // macos has a lot of voices but only some are appropriate for any particular language
    // this is a dictionary of names with language codes (for display) to voice names (for tts)
    private voiceDict: {[key: string]: string} = {};
    private say: typeof say;

    constructor() {
        super();
        this.canPause = false;

        this.getVoiceDict()

        this.voices = this.getVoices();
        this.voice = this.voices[0];

        this.say = say.Say(undefined);
    }

    getVoices(): Array<string> {
        return Object.keys(this.voiceDict);
    }

    setVoice(newVoice: string): void {
        if (this.voiceDict[newVoice]) {
            this.voice = newVoice;
        }
    }

    speak(input: string): void {
        this.say.speak(input, this.voice, this.rate);
    }

    stop(): void {
        this.say.stop();
    }

    private async getVoiceDict(): Promise<void> {
        let [voices] = await Promise.all([say.getInstalledVoices()]);

        const voiceDict: {[key: string]: string} = {};

        if (say.platform === "darwin") {
            const regex = /([A-Za-z]*)\s\(.*\)/;
            for (const voice of voices) {
                const match = voice.match(regex);  // extract "Alex (en_US)" -> "Alex"
                if (match) {
                    voiceDict[voice] = match[1];
                }
            }
        } else if (say.platform === "win32") {
            for (const voice of voices) {
                voiceDict[voice] = voice;
            }
        } else if (say.platform === "linux") {
            // linux get voices not currently supported (getInstalledVoices will throw an error)
            // code will go here eventually
            voiceDict[VOICES_UNAVAILABLE] = "";
        } else {
            voiceDict[VOICES_UNAVAILABLE] = "";
        }

        this.voiceDict = voiceDict;
    }
}