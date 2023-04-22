import {getPref, setPref} from "../prefUtils";

export abstract class Base {
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

    abstract speak(input: string): null;

    abstract stop(): null;

    protected pause?(): null

    abstract getVoices(): Array<string>;

    abstract setVoice(newVoices: string): null;

    getRate(): number {
        if (this.rate === undefined) {
            this.rate = getPref("voiceRate") as number
        }
        return this.rate
    }

    setRate(newRate: number): null {
        this.rate = newRate
        setPref("voiceRate", this.rate)
        return null
    }

    getPitch(): number {
        if (this.pitch === undefined) {
            this.pitch = getPref("voicePitch") as number
        }
        return this.pitch
    }

    setPitch(newPitch: number): null {
        this.pitch = newPitch
        setPref("voicePitch", this.pitch)
        return null
    }

    getVolume(): number {
        if (this.volume === undefined) {
            this.volume = getPref("voiceVolume") as number
        }
        return this.volume
    }

    setVolume(newVolume: number): null {
        this.volume = newVolume
        setPref("voiceVolume", this.volume)
        return null
    }
}