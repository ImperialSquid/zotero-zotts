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
    }

    private static registerNotifier(func: Function){
        const callback = {
            notify: async (
                event: string,
                type: string,
                ids: number[] | string[],
                extraData: { [key: string]: any }
            ) => {
                if (!addon?.data.alive) {
                    ZoTTS.unregisterNotifier(notifierID);
                    return;
                }
                func(event, type, ids, extraData);
            },
        };

        const notifierID = ztoolkit.getGlobal("Zotero").Notifier.registerObserver(callback,
            ["tab","item","file",]
        );

        // Unregister callback when the window closes (important to avoid a memory leak)
        window.addEventListener(
            "unload",
            (e: Event) => { ZoTTS.unregisterNotifier(notifierID); },
            false
        );
    }

    private static unregisterNotifier(notifierID: string) {
        ztoolkit.getGlobal("Zotero").Notifier.unregisterObserver(notifierID);
    }
}