import { getString } from "./locale";

export {
    notifyGeneric,
    notifyTTSStatus,
    notifyStatus
}

function notifyStatus() {
    if (addon.data.tts.status === "error") {
        // ZoTTS has failed to load any engines
        const header =  getString("popup-addonErrorTitle")
        const trailer = getString("popup-errorTrailer")

    } else if (addon.data.tts.status === "loading") {
        // ZoTTS is still loading all engines
        const header =  getString("popup-addonLoadingTitle")
        const trailer = getString("popup-loadingTrailer")

    } else if (addon.data.tts.engines[addon.data.tts.current]?.status === "error") {
        // ZoTTS has loaded an engine, but the currently selected one has errored
        notifyTTSStatus(
          addon.data.tts.current,
          addon.data.tts.engines[addon.data.tts.current]?.errorMsg ?? ""
        )

    } else if (addon.data.tts.engines[addon.data.tts.current]?.status === "loading") {
        // ZoTTS has loaded an engine, but the currently selected one is still loading
        const header =  getString("")
        const message = getString("", {
            args: {

            }
        })
        const trailer = getString("popup-loadingTrailer")

    } else if (addon.data.tts.status === "ready" &&
      addon.data.tts.engines[addon.data.tts.current]?.status === "ready") {
        // ZoTTS has loaded an engine, and it's the currently selected one
        const message = getString("popup-allGood")

        notifyGeneric([message, ], "info")
    }
}

function notifyTTSStatus(
  engine: string,
  error?: string
) {
    const headerKey =
      addon.data.tts.engines[addon.data.tts.current]?.status === "error"
        ? "popup-engineErrorTitle"
        : "popup-engineLoadingTitle"
    const header = getString(headerKey, {
        args: {
            engine: engine
        }
    })

    let message = ""
    if (addon.data.tts.engines[addon.data.tts.current]?.status === "error")
        message = getString("popup-engineErrorCause", {
            args: {
                engine: engine,
                // use the error provided, the error stored at startup or an empty string, whichever is first
                cause: error ?? addon.data.tts.engines[addon.data.tts.current]?.errorMsg ?? ""
            }
        })

    const trailerKey =
      addon.data.tts.engines[addon.data.tts.current]?.status === "error"
        ? "popup-errorTrailer"
        : "popup-loadingTrailer"
    const trailer = getString(trailerKey)

    // manually typed since TS doesn't detect that this fulfills the type requirement for some reason
    const strings: [string, ...string[]] = message
      ? [header, message, trailer]
      : [header, trailer]

    notifyGeneric(
      strings,
      "error"
    )
}

function notifyGeneric(
  strings: [string, ...string[]],  // one or more strings, the first is the title, the rest are extra info
  level: "info" | "error" | "critical",
  timer?: number
) {
    const defaultIcons = {
        "info": "", // TODO - ui: figure out how icons work in ztoolkit popups
        "error": "",
        "critical": ""
    }

    // set notification timer if none set
    const defaultTimers = {
        "info": 2000,
        "error": 7500,
        "critical": 0
    }
    timer ??= defaultTimers[level]

    // create popup
    const popup = new Zotero.ProgressWindow({closeOnClick: true})
    popup.changeHeadline("ZoTTS")

    // add text
    popup.addLines(strings.shift() ?? "", defaultIcons[level])  // first line gets the icon
    strings.forEach((text) => {
        popup.addLines(text, "")
    })  // any remaining lines don't

    // show
    popup.show()
    popup.startCloseTimer(timer)
}