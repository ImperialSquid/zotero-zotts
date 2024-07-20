import { config } from "../../package.json"


export function registerMenu() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/speak@16.svg`
    ztoolkit.Menu.register("item", {
        tag: "menuseparator",
    })
    ztoolkit.Menu.register("item", {
        tag: "menuitem",
        // TODO: l10n - implement locale
        label: "Read Title",
        commandListener: (ev) => {
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("title") as string
            addon.hooks.onSpeak(title)
        },
        icon: menuIcon,
    })

    ztoolkit.Menu.register("item", {
        tag: "menuitem",
        // TODO: l10n - implement locale
        label: "Read Abstract",
        commandListener: (ev) => {
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("abstractNote") as string
            addon.hooks.onSpeak(title)
        },
        icon: menuIcon,
    })
}