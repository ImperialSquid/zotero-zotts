import { checkStatus } from "."
import { getString } from "../utils/locale"
import { getPref, setPref } from "../utils/prefs"
import {
    getFullText,
    getSelectedAnnotations,
    getSelectedText,
    getSelectedTextToEnd
} from "../utils/readerUtils"
import { preprocessText } from "../utils/text";
import { notifyTTSStatus } from "../utils/notify";

//   might be nice to reformat text into a better form, might have to be managed by each engine internally
function speak(text: string) {
    if (checkStatus()) {
        text = preprocessText(text)

        addon.data.tts.engines[addon.data.tts.current].speak(text)
    } else {
        notifyTTSStatus(addon.data.tts.current)
    }
}

function stop() {
    if (checkStatus()) {
        addon.data.tts.engines[addon.data.tts.current].stop()
    } else {
        notifyTTSStatus(addon.data.tts.current)
    }
}

// TODO: future - implement skipping to next as well as cancelling all

function pause() {
    if (checkStatus()) {
        if (addon.data.tts.engines[addon.data.tts.current].canPause) {
            // @ts-ignore
            addon.data.tts.engines[addon.data.tts.current].pause()
        }
    } else {
        notifyTTSStatus(addon.data.tts.current)
    }
}

function resume() {
    if (checkStatus()) {
        if (addon.data.tts.engines[addon.data.tts.current].canPause) {
            // @ts-ignore
            addon.data.tts.engines[addon.data.tts.current].resume()
        }
    } else {
        notifyTTSStatus(addon.data.tts.current)
    }
}

// for speaking using shortcuts and UI elements not specifically tied to any text (eg text selection popup)
async function contextualSpeak(shiftHeld?: boolean) {
    if (Zotero_Tabs.selectedType == "library") {
        // library tab context

        let items = Zotero.getActiveZoteroPane().getSelectedItems()
        // TODO: future - add extra handling for other item types?

        let swap: boolean
        if (shiftHeld === undefined) {
            swap = false
        } else {
            swap = shiftHeld !== (getPref("shortcuts.swapLibraryItem") === "true")
        }

        if (items.length === 0) {
            // if none selected, skip
            return
        } else if ((items.length === 1) ||
            (items.length > 1 && getPref("newItemBehaviour") === "cancel")) {
            // if single item, or if multiple items but queue disabled, just read first

            let text = swap ? items[0].getField("abstractNote") : items[0].getDisplayTitle()
            speak(text)
        } else {
            // if multiple items and queue enabled, read all

            items.forEach((i) => {
                let text = swap ? i.getField("abstractNote") : i.getDisplayTitle()
                speak(text)
            })
        }
    } else {
        // reader tab context

        let reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)
        if (reader === undefined) {
            return
        }
        let selectedAnnos = getSelectedAnnotations(reader)

        if (ztoolkit.Reader.getSelectedText(reader) !== "") {
            // if text selected, read
            let swap: boolean
            if (shiftHeld === undefined) {
                swap = false
            } else {
                swap = shiftHeld !== (getPref("shortcuts.swapSpeakSelection") === "true")
            }

            let text = swap ? await getSelectedTextToEnd(reader) : getSelectedText(reader)
            speak(text)

        } else if (selectedAnnos.length > 0) {
            // if annos selected, read them instead
            let swap: boolean
            if (shiftHeld === undefined) {
                swap = false
            } else {
                swap = shiftHeld !== (getPref("shortcuts.swapAnnotation") === "true")
            }

            if ((selectedAnnos.length === 1) ||
                (selectedAnnos.length > 1 && getPref("newItemBehaviour") === "cancel")) {
                // if single anno, or if multiple anno and queue disabled, just read first

                let text = swap ? selectedAnnos[0].comment : selectedAnnos[0].text
                speak(text || "")
            } else {
                // if multiple annotation and queue enabled, read all

                selectedAnnos.forEach((a) => {
                    let text = swap ? a.comment : a.text
                    speak(text || "")
                })
            }
        } else {
            // no selected text and no selected annos, speak full text

            speak(await getFullText(reader) || "")
        }
    }
}

function speakOrResume(shiftHeld?: boolean) {
    if (addon.data.tts.state === "paused") {
        resume()
    } else {
        void contextualSpeak(shiftHeld)
    }
}

// used in prefs window to test voice without having to switch back and forth
function speakTest(engineName?: string, customText?: string) {
    const engine = engineName || addon.data.tts.current;

    if (addon.data.tts.engines[engine]?.status === "ready") {
        const text = customText || getString("speak-testVoice");
        const processedText = preprocessText(text);
        addon.data.tts.engines[engine].speak(processedText);
    } else {
        notifyTTSStatus(engine);
    }
}

function speedChange(speedUp = true){
    const currEngine = getPref("ttsEngine.current") as string
    const currSpeed = getPref(`${currEngine}.rate`) as number
    // find new speed and clip to range
    const newSpeed = Math.min(Math.max(currSpeed + (speedUp ? 10 : -10), 40), 300)
    setPref(`${currEngine}.rate`, newSpeed)
}

export {
    speak,
    stop,
    pause,
    resume,
    speakOrResume,
    speakTest,
    speedChange
}