import Addon from "../../addon"

async function initEngines(addon: Addon) {
    const { getPref } = await import("../utils/prefs");

    const currentEngine = getPref("ttsEngine.current") as string || "webSpeech";
    addon.data.tts.current = currentEngine;

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

    let azurePromise = import("./azure").then(
      (e) => {
          e.setDefaultPrefs()

          addon.data.tts.engines["azure"] = {
              status: "loading",
              speak: e.speak,
              stop: e.stop,
              canPause: true,
              pause: e.pause,
              resume: e.resume,
              extras: {
                  getAllVoices: e.getAllVoices,
                  extractLanguages: e.extractLanguages,
                  filterVoicesByLanguage: e.filterVoicesByLanguage,
                  resetConnection: e.resetConnection,
                  dispose: e.dispose
              }
          }

          return e
      }
    ).then(
      async (e) => {
          await e.initEngine()
          addon.data.tts.engines["azure"].status = "ready"
      }
    ).catch(
      (e) => {
          addon.data.tts.engines["azure"].errorMsg = e
          addon.data.tts.engines["azure"].status = "error"
      }
    )

    // TODO: future - implement more engines
    //   Google?
    //   OS native (macOS, Windows, Linux) but not WSA?
    //   etc

    try {
        await Promise.any([
            wsaPromise,
            azurePromise,
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