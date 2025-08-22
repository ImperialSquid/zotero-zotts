import Addon from "../../addon"

async function initEngines(addon: Addon) {
    addon.data.tts.current = "webSpeech"

    // TODO: optim - importing most engines with be similar, abstract this into a function?
    let wsaPromise = import("./webSpeech").then(
      (e) => {
          e.setDefaultPrefs()

          addon.data.tts.engines["webSpeech"] = {
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
          addon.data.tts.engines["webSpeech"].errorMsg = e
          addon.data.tts.engines["webSpeech"].status = "error"
      }
    )

    addon.data.tts.current = "mozillaTTS"

    let mozTTSPromise = import("./mozillaTTS").then(
        (e) => {
            addon.data.tts.engines["mozillaTTS"] = {
                name: "Mozilla Text-to-Speech for all.",
                status: "loading",
                speak: e.speak,
                stop: e.stop,
                canPause: false,
                pause: e.pause,
                resume: e.resume,
                extras: {
                }
            }

            return e
        }
    ).then(
        (e) => {
            addon.data.tts.engines["mozillaTTS"].status = "ready"
        }
    )
    .catch(
        (e) => {
            // ztoolkit.log(`WSA init fail - ${e}`)
            addon.data.tts.engines["mozillaTTS"].status = "error"
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
            mozTTSPromise
            // TODO: future - other engines promises here
        ])
        addon.data.tts.status = "ready"
    } catch {
        addon.data.tts.status = "error"
    }
}

function checkStatus() {
    return addon.data.tts.status === "ready"
      && addon.data.tts.engines[addon.data.tts.current].status === "ready"
}

type TTSEngineWithPause = {
    speak: (t: string) => void
    stop: () => void
    canPause: true
    pause: () => void
    resume: () => void
}

type TTSEngineWithoutPause = {
    speak: (t: string) => void
    stop: () => void
    canPause: false
}

type TTSEngine = (TTSEngineWithPause | TTSEngineWithoutPause) & {
    status: "loading" | "ready" | "error"
    extras: {
        [key: string]: any
    }
    errorMsg?: string
}

export {
    initEngines,
    checkStatus,
    TTSEngine
}