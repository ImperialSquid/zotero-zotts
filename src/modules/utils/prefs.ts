import { config } from "../../../package.json"

export function getPref(key: string) {
    return Zotero.Prefs.get(`${config.prefsPrefix}.${key}`, true)
}

export function setPref(key: string, value: string | number | boolean) {
    return Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, value, true)
}

export function clearPref(key: string) {
    return Zotero.Prefs.clear(`${config.prefsPrefix}.${key}`, true)
}

export function setDefaultPrefs() {
    if (!getPref("ttsEngine.current")) {
        setPref("ttsEngine.current", "mozillaTTS")
    }

    // Mac seems to delay loading WSA a lot so set a much higher reload tries value for them specifically
    if (Zotero.isMac && !getPref("ttsEngine.reloadTries")) {
        setPref("ttsEngine.reloadTries", 30)
    } else if (!getPref("ttsEngine.reloadTries")) {
        setPref("ttsEngine.reloadTries", 5)
    }
}