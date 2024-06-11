import {ttsEngineBase} from "./ttsBase";
import {ttsWebSpeech} from "./ttsWebSpeech";
import {ttsWindows, ttsLinux, ttsMacOS} from "./ttsSay";

export class ttsManager {
    private engines: Array<ttsEngineBase> = [];

    constructor() {
        this.setupEngines()
    }

    private setupEngines() {
        if (ztoolkit.isZotero7()) {
            this.engines.push(new ttsWebSpeech());
        }

        if (Zotero.isWindows()) {
            this.engines.push(new ttsWindows());
        } else if (Zotero.Zotero.isMacOS()) {
            this.engines.push(new ttsMacOS());
        } else if (Zotero.isLinux()) {
            this.engines.push(new ttsLinux());
        }
    }
}