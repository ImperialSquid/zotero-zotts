import {getPref} from "./utils/prefs";
// import {getString} from "./utils/locale";


export function registerMenu() {
    // const menuIcon = `chrome://${config.addonRef}/content/icons/favicon.png`;
    ztoolkit.Menu.register("item", {
        tag: "menuseparator",
    });
    ztoolkit.Menu.register("item", {
        tag: "menuitem",
        // TODO: l10n - implement locale
        label: "Read Title",
        commandListener: (ev) => {
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("title") as string;
            addon.hooks.onSpeak(title);
        },
        // TODO: prettify - add icon
        // icon: menuIcon,
    });
    ztoolkit.Menu.register("item", {
        tag: "menuitem",
        // TODO: l10n - implement locale
        label: "Read Abstract",
        commandListener: (ev) => {
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("abstractNote") as string;
            addon.hooks.onSpeak(title);
        },
        // TODO: prettify - add icon
        // icon: menuIcon,
    });
}