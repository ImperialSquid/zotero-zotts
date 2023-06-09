import { config } from "../../package.json";

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
    let pitch = (getPref("voicePitch") as number) || -1
    if (pitch < 0 || pitch > 2){  // constrain pitch to [0,2], as limited by spec
        setPref("voicePitch", 1)
    }

    let rate = (getPref("voiceRate") as number) || -1
    if (rate < 1/4 || rate > 4){  // constrain rate to [0.25x, 4x], spec limits to [0.1x, 10x] but those are very wide
        setPref("voiceRate", 1)
    }

    let volume = (getPref("voiceVolume") as number) || -1
    if (volume < 0 || volume > 1){  // constrain rate to [0, 1], as limited by spec
        setPref("voiceVolume", 1)
    }
}