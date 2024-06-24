import {getPref, setPref} from "../utils/prefs";

function speak(text: string) {
    ztoolkit.log(`Speaking: ${text}`);

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    let utt = new window.SpeechSynthesisUtterance(text);
    let voices = window.speechSynthesis.getVoices();
    utt.voice = voices[0];
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
}

export {
    speak,
    stop,
    pause,
    resume,
    setDefaultPrefs,
}