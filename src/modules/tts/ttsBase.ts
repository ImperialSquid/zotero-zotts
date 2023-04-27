import {getPref, setPref} from "../prefUtils";

export abstract class ttsBase {
    protected rate: number = 1
    protected pitch: number = 1
    protected volume: number = 1
    protected abstract canPause: boolean
    protected abstract voices: Array<string>

    constructor(rate?: number, pitch?: number, volume?: number) {
        // set defaults if defined, otherwise get from prefs
        rate ? this.rate = rate : this.getRate()
        pitch ? this.pitch = pitch : this.getPitch()
        volume ? this.volume = volume : this.getVolume()
    }

    abstract speak(input: string): void;

    abstract stop(): void;

    protected pause?(): void;

    abstract getVoices(): Array<string>;

    abstract setVoice(newVoices: string): void;

    getRate(): number {
        if (this.rate === undefined) {
            this.rate = getPref("voiceRate") as number
        }
        return this.rate
    }

    setRate(newRate: number): void {
        this.rate = newRate
        setPref("voiceRate", this.rate)
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