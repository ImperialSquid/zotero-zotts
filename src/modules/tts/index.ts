import Addon from "../../addon"

export function initEngines(addon: Addon) {
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
        (e) => {
            // wsa init

            addon.data.tts.engines["webSpeech"].status = "ready"
        }
    ).catch(
        ()  => {
            addon.data.tts.engines["webSpeech"].status = "error"
        }
    )

    // TODO: future - implement more engines
    //   Google?
    //   Azure?
    //   OS native (macOS, Windows, Linux) but not WSA?
    //   etc

    return Promise.any([
        wsaPromise,
        // TODO: future - other engine promises here
    ]).then(
        () => {
            addon.data.tts.status = "ready"
        }
    ).catch(
        () => {
            addon.data.tts.status = "error"
        }
    )
}