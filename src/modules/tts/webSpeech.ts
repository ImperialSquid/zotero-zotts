import {getPref, setPref} from "../utils/prefs";

function speak(text: string) {
    ztoolkit.log(`Speaking: ${text}`);

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    let utt = new window.SpeechSynthesisUtterance(text);

    utt.pitch = getPref("webSpeech.pitch") as number;
    utt.rate = getPref("webSpeech.rate") as number;
    utt.volume = getPref("webSpeech.volume") as number;

    utt.voice = getVoice(getPref("webSpeech.voice") as string)

    window.speechSynthesis.speak(utt);
}

function stop() {
    // TODO: WSA - implement
    ztoolkit.log("Stopping");
}

function pause() {
    // TODO: WSA - implement
    ztoolkit.log("Pausing");
}

function resume() {
    // TODO: WSA - implement
    ztoolkit.log("Resuming");
}

function setDefaultPrefs() {
    // TODO: WSA - implement
    ztoolkit.log("Setting default prefs");

    if (!getPref("webSpeech.pitch")) {
        setPref("webSpeech.pitch", 1);
    }

    if (!getPref("webSpeech.rate")) {
        setPref("webSpeech.rate", 1);
    }

    if (!getPref("webSpeech.volume")) {
        setPref("webSpeech.volume", 1);
    }

    if (!getPref("webSpeech.voice")) {
        let voice = window.speechSynthesis.getVoices()[0].name
        setPref("webSpeech.voice", voice);
    }
}

export {
    speak,
    stop,
    pause,
    resume,
    setDefaultPrefs,
}

function getVoice(voiceName: string) {
    let voices = window.speechSynthesis.getVoices()
    let filteredVoices = voices.filter((v) => v.name === voiceName)

    // if voice is not found for some reason, default to first voice
    if (filteredVoices.length === 0) {
        setPref("webSpeech.voice", voices[0].name)
        return voices[0]
    }

    return filteredVoices[0]
}