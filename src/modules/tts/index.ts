import Addon from "../../addon"
import { getString } from "../utils/locale";

export async function initEngines(addon: Addon) {
    addon.data.tts.current = "webSpeech"

    let wsaPromise = import("./webSpeech").then(
        (e) => {
            e.setDefaultPrefs()

            addon.data.tts.engines["webSpeech"] = {
                name: "Web Speech API",
                status: "loading",
                speak: e.speak,
                stop: e.stop,
                canPause: true,
                pause: e.pause,
                resume: e.resume,
                extras: {
                    // technically not needed here since populateVoiceList exists, but could be useful
                    getVoices: e.getVoices,
                    populateVoiceList: e.populateVoiceList
                }
            }

            return e
        }
    ).then(
        async (e) => {
            // ztoolkit.log("WSA Initing")
            await e.initEngine()
            // ztoolkit.log("WSA init success")
            addon.data.tts.engines["webSpeech"].status = "ready"
        }
    ).catch(
        (e) => {
            // ztoolkit.log(`WSA init fail - ${e}`)
            addon.data.tts.engines["webSpeech"].status = "error"
        }
    )

    // TODO: future - implement more engines
    //   Google?
    //   Azure?
    //   OS native (macOS, Windows, Linux) but not WSA?
    //   etc

    try {
        await Promise.any([
            wsaPromise,
            // TODO: future - other engines promises here
        ])
        addon.data.tts.status = "ready"
    } catch {
        addon.data.tts.status = "error"
    }
}

export function checkStatus() {
    return addon.data.tts.status === "ready"
        && addon.data.tts.engines[addon.data.tts.current].status === "ready"
}

export function reportStatus() {
    const popup = new Zotero.ProgressWindow({closeOnClick: true})
    popup.changeHeadline("ZoTTS")

    let text = ""
    let icon = ""
    let timer = 0

    // TODO: l10n - add status reporting localisation
    if (addon.data.tts.status === "error") {
        text = getString("status-ttsError")
        icon = ""  // TODO: UI - Add error SVG
        timer = 10000
    } else if (addon.data.tts.status === "loading") {
        text = getString("status-ttsLoading")
        icon = ""  // TODO: UI - Add notice SVG
        timer = 5000
    } else if (addon.data.tts.engines[addon.data.tts.current]?.status === "error") {
        text = getString("status-addonError",  {
            args: {
                engineName: addon.data.tts.engines[addon.data.tts.current]?.name
            }
        })
        icon = ""  // TODO: UI - Add error SVG
        timer = 10000
    } else if (addon.data.tts.engines[addon.data.tts.current]?.status === "loading") {
        text = getString("status-addonLoading",  {
            args: {
                engineName: addon.data.tts.engines[addon.data.tts.current]?.name
            }
        })
        icon = ""  // TODO: UI - Add notice SVG
        timer = 5000
    } else if (addon.data.tts.status === "ready" && addon.data.tts.engines[addon.data.tts.current]?.status === "ready") {
        text = getString("status-allGood")
        icon = "" // TODO: UI - Add ready SVG
        timer = 1500
    }

    popup.addLines(text, icon)

    popup.show()
    popup.startCloseTimer(timer)
}