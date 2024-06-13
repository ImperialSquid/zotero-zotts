import {ttsEngineBase, ttsMixin} from "./base";

const synthesis = window.speechSynthesis;
const utterance = window.SpeechSynthesisUtterance;

export class webSpeech extends ttsMixin implements ttsEngineBase {
    public name: string;
    public canPause: boolean;
    private readonly voices: Array<string>;
    private voice: string;
    public paused: boolean = false;

    constructor() {
        super();
        this.name = "Web Speech API";
        this.canPause = true;
        this.voices = this.getVoices();
        this.voice = this.voices[0];
    }

    speak(input: string): void {
        this.stop() // prevent queueing multiple utterances for simplicity

        const utt = new utterance(input);
        utt.rate = this.getSpeed();
        utt.pitch = this.getPitch();
        utt.volume = this.getVolume();
        utt.voice = this.getVoiceByName(this.voice);

        synthesis.speak(utt);
    }

    stop(): void {
        synthesis.cancel();
    }

    pause(): void {
        synthesis.pause();
        this.paused = true;
    }

    resume(): void {
        synthesis.resume();
        this.paused = false;
    }

    getVoices(): Array<string> {
        return synthesis.getVoices().map((v) => `${v.name} (${v.lang})`)
    }

    setVoice(newVoice: string): void {
        if (this.voices.indexOf(newVoice) > -1) {
            this.voice = newVoice;
        }
    }

    private getVoiceByName(voice: string): SpeechSynthesisVoice {
        return synthesis.getVoices().filter((v) => `${v.name} (${v.lang})` === voice)[0];
    }
}