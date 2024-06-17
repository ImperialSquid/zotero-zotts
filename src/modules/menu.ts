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
            // TODO: implement queueing?
            let item = Zotero.Items.get(ZoteroPane.getSelectedItems(true)[0])
            let title = item.getField("title") as string;
            addon.hooks.onSpeak(title);
        },
        // icon: menuIcon,
    });
}