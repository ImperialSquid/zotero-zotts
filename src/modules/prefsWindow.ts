import { config, repository } from "../../package.json"
import { getString } from "./utils/locale";
import { getPref, setPref } from "./utils/prefs";

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

    // since subs aren't bound directly, it's value must be set manually on load
    (doc.getElementById(`${config.addonRef}-advanced-subs-input`) as
        // @ts-ignore
        HTMLParagraphElement).value = getPref("substitutions")

    // do refresh to set warning if needed
    prefsRefreshHook("load", doc)
}

export function prefsRefreshHook(type: string, doc: Document) {
    setTimeout( () => {
        let warn = (doc.getElementById(`${config.addonRef}-advanced-subs-warning`) as
            HTMLParagraphElement)
        let subs = (doc.getElementById(`${config.addonRef}-advanced-subs-input`) as
            // @ts-ignore
            HTMLParagraphElement).value

        let validation = validateSubs(subs)

        if (validation.valid) {
            warn.style.visibility = "hidden"

            // rather than bind preference to element, only store valid subs
            // direct binding would mean risking loading bad subs on startup
            // this way they're always valid
            setPref("substitutions", subs)
        } else {
            warn.textContent = getString("pref-subs-warning", {
                args: {
                    count: validation.errors.length,
                    lines: validation.errors.join(", ")
                }
            })
            warn.style.visibility = "visible"
        }
    }, 10)
}

export function validateSubs(subs: string): SubsValidation {
    let lines: string[] = subs.split("\n")
    let validation: SubsValidation = {
        valid: true,
        errors: [],
        subs: []
    }

    // no subs to validate
    if (lines[0].length === 0) {
        return validation
    }

    lines.forEach((value, index) => {
        if (value === "" || value.charAt(0) === "#") {
            // skip lines that are empty or commented out
            return
        }

        let results = /^([\/"])(.+?)\1:(".*?")$/.exec(value)
        if (! results) {
            validation.valid = false
            validation.errors.push(index + 1)
        } else {
            validation.subs.push([
                results[2],
                results[3],
                results[1] === "/" ? "regex" : "string"
            ])
        }
    })

    return validation
}

type SubsValidation = {
    valid: boolean
    errors: number[]
    subs: [
        string,  // pattern
        string,  // replacement
        "string" | "regex"
    ][]
}