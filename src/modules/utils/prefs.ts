import { config } from "../../../package.json";

export function getPref(key: string) {
    return Zotero.Prefs.get(`${config.prefsPrefix}.${key}`, true);
}

export function setPref(key: string, value: string | number | boolean) {
    return Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, value, true);
}

export function clearPref(key: string) {
    return Zotero.Prefs.clear(`${config.prefsPrefix}.${key}`, true);
}

export function setDefaultPrefs() {
    if (!getPref("ttsEngine")) {
        setPref("ttsEngine", "webSpeech");
    }

    if (!getPref("pitch")) {
        setPref("pitch", 1);
    }

    if (!getPref("speed")) {
        setPref("speed", 1);
    }

    if (!getPref("volume")) {
        setPref("volume", 1);
    }
}