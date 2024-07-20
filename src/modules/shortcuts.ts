import {getPref} from "./utils/prefs";

export function registerShortcuts() {
    // TODO: prefs - add main key to settings
    //   S for Speech is nice but maybe not desirable for user
    // TODO: prefs - implement toggle between title/abstract and annotation/comment reading
    ztoolkit.Keyboard.register((ev, data) => {
        if (data.type === "keyup") {
            if (ev.ctrlKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.speak") as string).toLowerCase()) {
                addon.hooks.onContextualSpeak()
            }

            if (ev.ctrlKey && ev.shiftKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.pause") as string).toLowerCase()) {
                addon.hooks.onPause()
            }

            if (ev.ctrlKey && ev.shiftKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.cancel") as string).toLowerCase()) {
                addon.hooks.onStop()
            }
        }
    })
}