import { config, repository } from "../../package.json"
import { getString } from "./utils/locale";
import { getPref, setPref } from "./utils/prefs";
import { addFavourite, removeFavourite } from "./favourites";
import { getAzureConfig } from "./tts/azure";

// Azure voices cache (in-memory, cleared on reload)
let azureVoicesCache: any[] | null = null;
let lastAzureKey: string = "";
let lastAzureRegion: string = "";

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
    // disable/grey out engines that have errored
    for (let engine in addon.data.tts.engines) {
        if (addon.data.tts.engines[engine].status === "error") {
            const engineRoot = doc.getElementById(`zotts-${engine}`)
            for (let node of engineRoot?.getElementsByTagName("*") ?? []) {
                if (node.id !== `zotts-${engine}-header`){
                    node.setAttribute("disabled", "true")
                }
            }

            // Disable radio button for failed engine (error details shown in engine's own section)
            const radioButton = doc.getElementById(`engine-${engine}`) as HTMLInputElement
            if (radioButton) {
                radioButton.setAttribute("disabled", "true")
            }

            // Hide settings section for failed engine
            const settingsSection = doc.getElementById(`${config.addonRef}-${engine}`)
            if (settingsSection) {
                settingsSection.style.display = "none"
            }
        }
    }

    // populate voices list for Web Speech
    if (addon.data.tts.engines.webSpeech?.extras?.populateVoiceList) {
        addon.data.tts.engines.webSpeech.extras.populateVoiceList(doc)
    }

    // Initialize Azure voices (async, but we don't wait for it)
    updateAzureVoices(doc);

    // shortcuts section modelled on core Zotero
    for (let label of Array.from(doc.querySelectorAll(".modifier")) as Element[]) {
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
    
    // set minSegmentSize radiogroup value from pref (number -> string for UI)
    const minSegmentSizeRadio = doc.getElementById("azure-minSegmentSize") as unknown as XULRadioGroupElement;
    if (minSegmentSizeRadio) {
        const value = getPref("azure.minSegmentSize") as number || 8;
        minSegmentSizeRadio.value = String(value);
    }

    // set default test text for Azure
    const azureTestText = doc.getElementById("azure-testText") as HTMLInputElement;
    if (azureTestText) {
        azureTestText.value = getString("speak-testVoice");
    }

    // do refresh to set warning if needed
    prefsRefreshHook("load", doc)
}

// called whenever prefs pane needs to respond interactively to input,
// dispatch to other functions based on passed in type
function prefsRefreshHook(type: string, doc: Document) {
    if (type === "load") {
        setTimeout(() => {
            updateTTSEngineStatuses(doc)
            setSubsTextareaWarning(doc)
            setSubsCiteOverall(doc)
            refreshFavesList(doc)
            updateTestVoiceButtons(doc)
        },10)
    } else if (type === "engine-change") {
        handleEngineChange(doc)
    } else if (type === "azure-key-change" || type === "azure-region-change") {
        handleAzureKeyRegionChange(doc)
    } else if (type === "azure-language-change") {
        handleAzureLanguageChange(doc)
    } else if (type === "azure-voice-change") {
        updateTestVoiceButtons(doc)
    } else if (type === "azure-minSegmentSize-change") {
        handleAzureMinSegmentSizeChange(doc)
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

function handleEngineChange(doc: Document): void {
    const radiogroup = doc.querySelector('radiogroup[preference*="ttsEngine.current"]') as unknown as XULRadioGroupElement;
    const selectedEngine = radiogroup?.value as string;

    if (selectedEngine) {
        addon.data.tts.current = selectedEngine;
    }
}

function updateTTSEngineStatuses(doc: Document) {
    for (const key in addon.data.tts.engines) {
        const statusPara = doc.getElementById(`${key}-status`)
        if (!statusPara) {
            continue // no status exists for this engine
        }

        if (addon.data.tts.engines[key]?.status === "ready") {
            doc.l10n?.setAttributes(
              statusPara,
              `${config.addonRef}-pref-status-allGood`,
              {
                  "engine": key
              })
            statusPara.style.color = "#94bd3a"
        } else {
            doc.l10n?.setAttributes(
              statusPara,
              `${config.addonRef}-pref-status-error`,
              {
                  "engine": key,
                  "cause": addon.data.tts.engines[key].errorMsg ?? ""
              })
            statusPara.style.color = "tomato"
        }
    }
}

// Test Voice button management
function updateTestVoiceButtons(doc: Document): void {
    // Update Azure Test Voice button
    const azureBtn = doc.getElementById("azure-testVoice-btn") as HTMLButtonElement;
    if (azureBtn) {
        // Start with config values (env vars + preferences)
        const config = getAzureConfig();
        let key = config.key;
        let region = config.region;

        // Override with UI input if present (captures real-time changes)
        const keyInput = doc.getElementById("azure-key") as HTMLInputElement;
        const regionInput = doc.getElementById("azure-region") as HTMLInputElement;

        const uiKey = (keyInput?.value || "").trim();
        const uiRegion = (regionInput?.value || "").trim();

        if (uiKey) key = uiKey;
        if (uiRegion) region = uiRegion;

        // Read language and voice from UI
        const languageMenu = doc.getElementById("azure-language") as unknown as XULMenuListElement;
        const voiceMenu = doc.getElementById("azure-voice") as unknown as XULMenuListElement;

        const language = (languageMenu?.value || "").trim();
        const voice = (voiceMenu?.value || "").trim();

        const languageDisabled = languageMenu?.hasAttribute("disabled");
        const voiceDisabled = voiceMenu?.hasAttribute("disabled");

        // Enable only if all required fields have values and controls are not disabled
        if (key && region && language && voice && !languageDisabled && !voiceDisabled) {
            azureBtn.removeAttribute("disabled");
        } else {
            azureBtn.setAttribute("disabled", "true");
        }
    }
}

function handleAzureKeyRegionChange(doc: Document): void {
    const { key: currentKey, region: currentRegion } = getAzureConfig();

    // Check if values actually changed
    const keyChanged = currentKey !== lastAzureKey;
    const regionChanged = currentRegion !== lastAzureRegion;

    if (keyChanged || regionChanged) {
        lastAzureKey = currentKey;
        lastAzureRegion = currentRegion;

        // Reset Azure connection to force reconnection with new credentials
        addon.data.tts.engines["azure"]?.extras?.resetConnection?.();

        // If we have cache, don't do anything
        if (azureVoicesCache) {
            return;
        }

        // No cache, attempt to fetch
        updateAzureVoices(doc);
    }
}

function handleAzureLanguageChange(doc: Document): void {
    const languageMenu = doc.getElementById("azure-language") as unknown as XULMenuListElement;
    const language = languageMenu?.value;

    // If we have cache, populate voices for the new language
    if (azureVoicesCache && language) {
        populateAzureVoices(doc, azureVoicesCache, language);
        updateTestVoiceButtons(doc);
    }
}

// Azure voice management functions
async function updateAzureVoices(doc: Document): Promise<void> {
    // If we already have cache, use it to populate UI
    if (azureVoicesCache) {
        unlockAzureControls(doc);
        populateAzureLanguages(doc, azureVoicesCache);
        const currentLang = getPref("azure.language") as string;
        if (currentLang) {
            populateAzureVoices(doc, azureVoicesCache, currentLang);
        }
        updateTestVoiceButtons(doc);
        return;
    }

    const { key, region } = getAzureConfig();

    // If either is empty, lock controls
    if (!key || !region) {
        lockAzureControls(doc);
        return;
    }

    // Fetch voices from API
    const azureModule = addon.data.tts.engines["azure"]?.extras;
    if (!azureModule || !azureModule.getAllVoices) {
        ztoolkit.log("Azure module not available");
        lockAzureControls(doc);
        return;
    }

    const result = await azureModule.getAllVoices();

    if (result.success && result.voices.length > 0) {
        // Cache the voices
        azureVoicesCache = result.voices;

        // Unlock controls
        unlockAzureControls(doc);

        // Populate language list
        populateAzureLanguages(doc, result.voices);

        // Populate voices for current language
        const currentLang = getPref("azure.language") as string;
        if (currentLang) {
            populateAzureVoices(doc, result.voices, currentLang);
        }

        // Update test button state after populating voices
        updateTestVoiceButtons(doc);
    } else {
        lockAzureControls(doc);
    }
}

function populateAzureLanguages(doc: Document, voices: any[]): void {
    const languageMenu = doc.getElementById("azure-language") as unknown as XULMenuListElement;
    const languagePopup = doc.getElementById("azure-language-popup");

    if (!languageMenu || !languagePopup) {
        return;
    }

    const azureModule = addon.data.tts.engines["azure"]?.extras;
    if (!azureModule || !azureModule.extractLanguages) {
        return;
    }

    const languages = azureModule.extractLanguages(voices);

    // Clear existing options
    languagePopup.innerHTML = '';

    // Add all language options
    languages.forEach((lang: string) => {
        const item = doc.createXULElement("menuitem");
        item.setAttribute("label", lang);
        item.setAttribute("value", lang);
        languagePopup.appendChild(item);
    });

    // Check if current pref value is in the list
    const currentLang = getPref("azure.language") as string;
    if (currentLang && languages.includes(currentLang)) {
        languageMenu.value = currentLang;
    } else {
        // Value not in list, show empty but don't modify pref
        languageMenu.selectedIndex = -1;
    }
}

function populateAzureVoices(doc: Document, voices: any[], language: string): void {
    const voiceMenu = doc.getElementById("azure-voice") as unknown as XULMenuListElement;
    const voicePopup = doc.getElementById("azure-voice-popup");

    if (!voiceMenu || !voicePopup) {
        return;
    }

    const azureModule = addon.data.tts.engines["azure"]?.extras;
    if (!azureModule || !azureModule.filterVoicesByLanguage) {
        return;
    }

    const voiceList = azureModule.filterVoicesByLanguage(voices, language);

    // Clear existing options
    voicePopup.innerHTML = '';

    // Add all voice options
    voiceList.forEach((voice: string) => {
        const item = doc.createXULElement("menuitem");
        item.setAttribute("label", voice);
        item.setAttribute("value", voice);
        voicePopup.appendChild(item);
    });

    // Check if current pref value is in the list
    const currentVoice = getPref("azure.voice") as string;
    if (currentVoice && voiceList.includes(currentVoice)) {
        voiceMenu.value = currentVoice;
    } else {
        // Value not in list, show empty but don't modify pref
        voiceMenu.selectedIndex = -1;
    }
}

function lockAzureControls(doc: Document): void {
    const languageMenu = doc.getElementById("azure-language") as unknown as XULMenuListElement;
    const voiceMenu = doc.getElementById("azure-voice") as unknown as XULMenuListElement;
    const testVoiceBtn = doc.getElementById("azure-testVoice-btn") as HTMLButtonElement;

    if (languageMenu) {
        languageMenu.setAttribute("disabled", "true");
    }
    if (voiceMenu) {
        voiceMenu.setAttribute("disabled", "true");
    }
    if (testVoiceBtn) {
        testVoiceBtn.setAttribute("disabled", "true");
    }
}

function unlockAzureControls(doc: Document): void {
    const languageMenu = doc.getElementById("azure-language") as unknown as XULMenuListElement;
    const voiceMenu = doc.getElementById("azure-voice") as unknown as XULMenuListElement;

    if (languageMenu) {
        languageMenu.removeAttribute("disabled");
    }
    if (voiceMenu) {
        voiceMenu.removeAttribute("disabled");
    }

    // Update Test Voice button state based on current values
    updateTestVoiceButtons(doc);
}

function handleAzureMinSegmentSizeChange(doc: Document): void {
    const radioGroup = doc.getElementById("azure-minSegmentSize") as unknown as XULRadioGroupElement;
    if (radioGroup?.value) {
        const numValue = parseInt(radioGroup.value, 10);
        if (!isNaN(numValue)) {
            setPref("azure.minSegmentSize", numValue);
        }
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
    let overall =
      (doc.getElementById(`${config.addonRef}-pref-subs-citationsOverall`) as HTMLInputElement)
    let subitems = Array.from(
      doc.querySelectorAll(`.${config.addonRef}-pref-subs-citations-subitems input`)
    ) as HTMLInputElement[]

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
                // use user-friendly engine name from locale files
                getString("ttsEngine-engineName", {args: {engine: fav["engine"]}}) +
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
