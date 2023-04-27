import {ZoteroToolkit} from "zotero-plugin-toolkit"
import {ttsBase} from "./tts/ttsBase";
import {ttsWebSpeech} from "./tts/ttsWebSpeech";
import {ttsSay} from "./tts/ttsSay";

export class ZoTTS {
    private ztk: ZoteroToolkit;
    private tts: ttsBase;

    constructor() {
        this.ztk = new ZoteroToolkit()

        if (this.ztk.isZotero7()) {
            this.tts = new ttsWebSpeech()
        } else {
            this.tts = new ttsSay()
        }
    }
}