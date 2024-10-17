import { config, repository } from "../../package.json"
import { getString } from "./utils/locale";
import { getPref, setPref } from "./utils/prefs";
import { addFavourite, removeFavourite } from "./favourites";
import { waitUtilAsync } from "./utils/wait";

function registerPrefsWindow() {
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

// one time call on prefs pane loading
function prefsLoadHook(type: string, doc: Document) {
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
        HTMLParagraphElement).value = getPref("subs.customSubs")

    // do refresh to set warning if needed
    prefsRefreshHook("load", doc)
}

// called whenever prefs pane needs to respond interactively to input,
// dispatch to other functions based on passed in type
function prefsRefreshHook(type: string, doc: Document) {
    if (type === "load") {
        setTimeout(() => {
            setSubsTextareaWarning(doc)
            setSubsCiteOverall(doc)
        },10)
    } else if (type === "subs-text") {
        setSubsTextareaWarning(doc)
    } else if (type === "subs-cite-overall") {
        setSubsCiteSubitems(doc)
    } else if (type === "subs-cite-subitem") {
        setSubsCiteOverall(doc)
    } else if (type === "faves-add-voice") {
        addNewFavourite(doc)
    } else if (type === "faves-remove-voice") {
        removeSelectedFavourite(doc)
    }
}

function setSubsTextareaWarning (doc: Document){
    setTimeout(() => {  // use timeout to allow for prefs to process first
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
            setPref("subs.customSubs", subs)
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

function validateSubs(subs: string): SubsValidation {
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

        let results = /^([\/"])(.+?)\1:"(.*?)"$/.exec(value)
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
        "string" | "regex"  // type of pattern
    ][]
}

function setSubsCiteSubitems(doc: Document) {
    let overall = (doc.getElementById(`${config.addonRef}-pref-subs-citationsOverall`) as
        HTMLInputElement)
    let subitems = (doc.querySelectorAll(`.${config.addonRef}-pref-subs-citations-subitems input`) as
        NodeListOf<HTMLInputElement>)

    subitems.forEach((item) => {
            item.checked = overall.checked
        }
    )
}

function setSubsCiteOverall(doc: Document) {
    let overall = (doc.getElementById(`${config.addonRef}-pref-subs-citationsOverall`) as
        HTMLInputElement)
    let subitems = (doc.querySelectorAll(`.${config.addonRef}-pref-subs-citations-subitems input`) as
        NodeListOf<HTMLInputElement>)

    let checkedCount = 0
    for (let item of subitems) {
        if (item.checked) {
            checkedCount++
        }
    }

    if (checkedCount === 0) {
        overall.indeterminate = false
        overall.checked = false
    } else if (checkedCount === subitems.length) {
        overall.indeterminate = false
        overall.checked = true
    } else {
        overall.indeterminate = true
        overall.checked = false
    }
}

function addNewFavourite(doc: Document) {
    addFavourite()

    refreshFavesList(doc)
}

function removeSelectedFavourite(doc: Document) {
    const selected = (doc.getElementById("faves-list") as HTMLSelectElement).selectedOptions
    if (selected.length === 0) {
        // no children selected, return out
        return
    }
    
    const favToRemove = JSON.parse(selected[0].value)
    removeFavourite(favToRemove)

    refreshFavesList(doc)
}

function refreshFavesList(doc: Document) {
    let favesListElement = (doc.getElementById("faves-list") as HTMLSelectElement)

    const faves = JSON.parse(getPref("favouritesList") as string)
    const newFaves = faves
        .map((fav : {[key: string]: string | number| boolean}) => {
            const text =
                "<b>" + fav["voice"] +
                "</b> - <i>" +
                addon.data.tts.engines[fav["engine"] as string].name +  // use user-friendly engine name
                "</i> || " +
                Object.keys(fav)  // map all other values to an "extra info" section
                    .map(key => {
                        if (key === "engine" || key === "voice") {
                            return ""
                        } else {
                            return key + ": " + fav[key]
                        }
                    })
                    .filter(text => text.length > 0)  // filter the empty strings from engine and voice
                    .join(", ")
            const value = JSON.stringify(fav)

            const elem = ztoolkit.UI.createElement(
                doc, "option",
                {
                    properties: {innerHTML: text},
                    attributes: {value: value}
                }
            )

            return elem
        })

    // removing and adding manually often resulted in incorrect visual output
    // use much more modern replaceChildren call instead
    // thanks to https://stackoverflow.com/a/65413839/7416433 for the heads up
    favesListElement.replaceChildren(...newFaves)

}

export {
    registerPrefsWindow,
    prefsLoadHook,
    prefsRefreshHook,
    validateSubs
}
