import { getPref } from "./utils/prefs";

export function registerShortcuts() {
    ztoolkit.Keyboard.register((ev, data) => {
        if (data.type === "keyup") {
            if (ev.ctrlKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.speak") as string).toLowerCase()) {
                addon.hooks.onSpeakOrResume(ev.shiftKey)
            }

            if (ev.ctrlKey && ev.shiftKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.pause") as string).toLowerCase()) {
                addon.hooks.onPause()
            }

            if (ev.ctrlKey && ev.shiftKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.cancel") as string).toLowerCase()) {
                addon.hooks.onStop()
            }

            if (ev.ctrlKey && ev.shiftKey &&
                ev.key.toLowerCase() === (getPref("shortcuts.cycleFavourite") as string).toLowerCase()) {
                addon.hooks.onCycleFavourite()
            }

            // TODO: issue - dynamic speed controls, GH issue #179
        }
    })
}