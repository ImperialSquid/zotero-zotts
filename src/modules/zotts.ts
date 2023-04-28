import {ttsBase} from "./tts/ttsBase";
import {ttsWebSpeech} from "./tts/ttsWebSpeech";
import {ttsSay} from "./tts/ttsSay";

export class ZoTTS {
    private tts: ttsBase;
    private html: HTMLElement;
    private state: string = "ready";

    constructor() {
        if (ztoolkit.isZotero7()) {
            this.tts = new ttsWebSpeech()
        } else {
            this.tts = new ttsSay()
        }

        if (this.tts.isPausable() && (this.tts.pause === undefined || this.tts.resume === undefined)) {
            this.tts.setPausable(false)
        }

        this.html = ztoolkit.UI.createElement(document, "div",  {
            id: "zotts-div",
            enableElementRecord: true,
            removeIfExists: true,
            children: [
                {tag: "button", id: "zotts-play", enableElementRecord: true,
                    properties: {innerText: "Play"},
                    listeners: [{type: "click", listener: () => {this.changeState("play")}}]},

                {tag: "button", id: "zotts-cancel", enableElementRecord: true,
                    properties: {innerText: "Cancel"},
                    listeners: [{type: "click", listener: () => {this.changeState("cancel")}}]},

                {tag: "button", id: "zotts-pause", enableElementRecord: true,
                    properties: {innerText: "Pause"},
                    listeners: [{type: "click", listener: () => {this.changeState("pause")}}]},

                {tag: "button", id: "zotts-resume", enableElementRecord: true,
                    properties: {innerText: "Resume"},
                    listeners: [{type: "click", listener: () => {this.changeState("resume")}}]},
            ]
        })
    }

    changeState(state: string) {
        this.state = state;
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