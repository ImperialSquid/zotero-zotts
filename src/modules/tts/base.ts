import {getPref, setPref} from "../utils/prefs";

// Establishes the base interface for a TTS engine
export type ttsEngineBase = {
    name: string;
    canPause: boolean;
    speak(input: string): void;
    stop(): void;
    pause?(): void;
    resume?(): void;
    getVoices(): Array<string>;
    setVoice(newVoices: string): void;
    getSpeed(): number;
    setSpeed(newSpeed: number): void;
    getPitch(): number;
    setPitch(newPitch: number): void;
    getVolume(): number;
    setVolume(newVolume: number): void;
}

// Common TTS settings and methods
export class ttsMixin {
    private pitch: number;
    private speed: number;
    private volume: number;

    constructor(speed: number = 1, pitch: number = 1, volume: number = 1) {
        this.speed = speed
        this.pitch = pitch
        this.volume = volume
    }

    getSpeed(): number {
        if (this.speed === undefined) {
            this.speed = getPref("voiceSpeed") as number
        }
        return this.speed
    }

    setSpeed(newSpeed: number): void {
        this.speed = newSpeed
        setPref("voiceSpeed", this.speed)
    }

    getPitch(): number {
        if (this.pitch === undefined) {
            this.pitch = getPref("voicePitch") as number
        }
        return this.pitch
    }

    setPitch(newPitch: number): void {
        this.pitch = newPitch
        setPref("voicePitch", this.pitch)
    }

    getVolume(): number {
        if (this.volume === undefined) {
            this.volume = getPref("voiceVolume") as number
        }
        return this.volume
    }

    setVolume(newVolume: number): void {
        this.volume = newVolume
        setPref("voiceVolume", this.volume)
    }
}