import {ttsEngineBase} from "./base";
import {webSpeech} from "./webSpeech";
import {ttsWindows, ttsLinux, ttsMacOS} from "./native";

export class manager {
    private engines: Array<ttsEngineBase> = [];

    constructor() {
        this.setupEngines()
    }

    private setupEngines() {
        if (ztoolkit.isZotero7()) {
            this.engines.push(new webSpeech());
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