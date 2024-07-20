import { config } from "../../package.json"
import { repository } from "../../package.json"

export function registerPrefsWindow() {
    Zotero.PreferencePanes.register(
        {
            pluginID: config.addonID,
            src: rootURI + "chrome/content/preferences.xhtml",
            id: config.addonInstance, // string, generated automatically
            // parent: string, allows hierarchy of panes, could be useful?
            // label: "ZoTTS",
            // image: string, defaults to icon in manifest
            scripts: [],
            stylesheets: [],
            helpURL: repository.url,
            // defaultXUL: boolean
        }
    ).then((e) => {})
}