import Addon from "../../addon";

export function initEngines(addon: Addon) {
    addon.data.tts.current = "webSpeech";

    import("./webSpeech").then(
        (e) => {
            e.setDefaultPrefs();
            addon.data.tts.engines["webSpeech"] = {
                name: "Web Speech API",
                speak: e.speak,
                stop: e.stop,
                canPause: true,
                pause: e.pause,
                resume: e.resume,
                extras: {getVoices: e.getVoices}
            }
        }
    )

    // TODO: future - implement more engines
    //   Google?
    //   Azure?
    //   OS native (macOS, Windows, Linux) but not WSA?
    //   etc
}