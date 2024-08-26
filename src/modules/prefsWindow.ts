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

export function prefsLoadHook(type: string, doc: Document) {
    // populate voices list
    addon.data.tts.engines.webSpeech.extras.populateVoiceList(doc)

    // shortcuts section modelled on core Zotero
    for (let label of doc.querySelectorAll(".modifier")) {
        // Display the appropriate modifier keys for the platform
        if (label.classList.contains("optional-shift")) {
            label.textContent = Zotero.isMac ?
                "Cmd (+ Shift) +" :
                "Ctrl (+ Shift) +"
        } else if (label.classList.contains("required-shift")) {
            label.textContent = Zotero.isMac ?
                "Cmd + Shift +" :
                "Ctrl + Shift +"
        }
    }
}