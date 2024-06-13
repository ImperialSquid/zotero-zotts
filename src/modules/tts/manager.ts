import {ttsEngineBase} from "./base";
import {webSpeech} from "./webSpeech";
// import {ttsWindows, ttsLinux, ttsMacOS} from "./native";

export class manager {
    engines: Array<ttsEngineBase> = [];
    currentEngine: ttsEngineBase;

    constructor() {
        this.setupEngines()

        this.currentEngine = this.engines[0];
    }

    private setupEngines() {
        if (ztoolkit.isZotero7()) {
            this.engines.push(new webSpeech());
        }

        // if (Zotero.isWindows()) {
        //     this.engines.push(new ttsWindows());
        // } else if (Zotero.Zotero.isMacOS()) {
        //     this.engines.push(new ttsMacOS());
        // } else if (Zotero.isLinux()) {
        //     this.engines.push(new ttsLinux());
        // }
    }
}