import { config } from "../../package.json"
import { getString } from "./utils/locale"


export function registerMenu() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/speak@16.svg`
    ztoolkit.Menu.register("item", {
        tag: "menuseparator",
    })
    ztoolkit.Menu.register("item", {
        tag: "menuitem",
        label: getString("itemMenu-title"),
        commandListener: (ev) => {
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("title") as string
            addon.hooks.onSpeak(title)
        },
        icon: menuIcon,
    })

    ztoolkit.Menu.register("item", {
        tag: "menuitem",
        label: getString("itemMenu-abstract"),
        commandListener: (ev) => {
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("abstractNote") as string
            addon.hooks.onSpeak(title)
        },
        icon: menuIcon,
    })
}