import {ttsBase} from "./tts/ttsBase";
import {ttsWebSpeech} from "./tts/ttsWebSpeech";
import {ttsSay} from "./tts/ttsSay";

export class ZoTTS {
    private tts: ttsBase;

    constructor() {
        if (ztoolkit.isZotero7()) {
            this.tts = new ttsWebSpeech()
        } else {
            this.tts = new ttsSay()
        }

        this.addButton()
    }

    private addButton() {
        this.ztk.ReaderInstance.register("initialized", "zotts",
            async (reader) => {
                await reader._initPromise
                await reader._waitForReader()
                this.ztk.log(`ZoTTS reader id ${reader.itemID} initialized`)
            })
    }
}