export function registerShortcuts() {
    // TODO: prefs - add main key to settings
    //   S for Speech is nice but maybe not desirable for user
    // TODO: prefs - implement toggle between title/abstract and annotation/comment reading
    ztoolkit.Keyboard.register((ev, data) => {
        if (data.type === "keyup") {
            if (ev.ctrlKey && ev.key === "s") {
                addon.hooks.onContextualSpeak()
            }
        }
    })
}