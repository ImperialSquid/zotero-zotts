import { getPref, setPref } from "../utils/prefs"
import {retryUntilAsync, waitUntil, waitUtilAsync} from "../utils/wait";
import MenuList = XUL.MenuList;

function speak(text: string) {
    // cancel is safe to call even when not speaking
    if (getPref("newItemBehaviour") === "cancel") {
      window.speechSynthesis.cancel()
    }

    let utt = new window.SpeechSynthesisUtterance(text)

    // set attributes for utterance
    utt.pitch = (getPref("webSpeech.pitch") as number)/100
    utt.rate = (getPref("webSpeech.rate") as number)/100
    utt.volume = (getPref("webSpeech.volume") as number)/100
    utt.voice = getVoice(getPref("webSpeech.voice") as string)

    // manage reflecting state into addon
    utt.onstart = () => {addon.data.tts.state = "playing"}
    utt.onend = () => {addon.data.tts.state = "idle"}
    utt.onpause = () => {addon.data.tts.state = "paused"}
    utt.onresume = () => {addon.data.tts.state = "playing"}

    // TODO: future - add "highlight as you hear" feature to highlight text as it's spoken?
    // utt.onmark triggers on word and sentence boundaries
    // text selection popup params contain rects used to draw selected text
    // very vaguely possible but might be quite janky...
    // currently deemed more work than it's worth, but happy to revisit

    window.speechSynthesis.speak(utt)
}

function stop() {
    window.speechSynthesis.cancel()
}

function pause() {
    window.speechSynthesis.pause()
}

function resume() {
    window.speechSynthesis.resume()
}

function setDefaultPrefs() {
    if (!getPref("webSpeech.pitch")) {
        setPref("webSpeech.pitch", 1)
    }

    if (!getPref("webSpeech.rate")) {
        setPref("webSpeech.rate", 1)
    }

    if (!getPref("webSpeech.volume")) {
        setPref("webSpeech.volume", 1)
    }

    if (!getPref("webSpeech.voice")) {
        let voice = window.speechSynthesis.getVoices()[0].name
        setPref("webSpeech.voice", voice)
    }
}

async function initEngine() {
    let initAttempt = () => {
        return new Promise<Error | void>((resolve, reject) => {
            if (window.speechSynthesis.getVoices().length < 1 ) {
                ztoolkit.log("WSA init fail - no voices")
                reject("no voices")  // reject on no voices

            }

            let utt = new window.SpeechSynthesisUtterance("initialised")
            utt.volume = 0  // prevent unnecessary noise

            utt.onerror = () => {
                ztoolkit.log("WSA init fail - errored utterance")
                reject("errored utterance")
            }  // reject on errored utterance
            utt.onend = () => {
                ztoolkit.log("WSA init success!")
                resolve()
            }  // voices are present and utterance succeeds, resolve

            window.speechSynthesis.speak(utt)
        })
    }

    await retryUntilAsync(initAttempt, 5, 100)
}

export {
    speak,
    stop,
    pause,
    resume,
    setDefaultPrefs,
    initEngine,
    getVoices,
    populateVoiceList
}

// extras
// also exported functions but not required to exist
function getVoices() {
    return window.speechSynthesis.getVoices().map((v) => v.name)
}

function populateVoiceList (doc: Document) {
    let menu = (doc.getElementById("webspeech-voice") as MenuList)
    menu.appendItem(
        "Loading Voices...",
        (getPref("webSpeech.voice") as string) // preserve pref while loading
    )

    waitUtilAsync(
        () => (getVoices() as Array<string>).length > 0,
        50,
        5000
    ).then(
        () => {
            // remove loading item
            ((menu.children as HTMLCollection)[0].children as HTMLCollection)[0].remove()
        }
    ).then(
        () => {
            // populate voices list
            let voices = (getVoices() as Array<string>)
            voices.forEach((v) => menu.appendItem(v, v))
        }
    ).catch(
        () => {
            // give user feedback
            menu.appendItem(
                "ERROR: Couldn't load voices",
                (getPref("webSpeech.voice") as string) // still preserve any previous values just in case
            )
        }
    );
}

// utils
// used elsewhere in engine, not exported
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