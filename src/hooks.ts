import { config } from "../package.json"
import { getPref, setDefaultPrefs } from "./modules/utils/prefs"
import ZoteroToolkit from "zotero-plugin-toolkit/dist/index"
import { registerMenu } from "./modules/menu"
import { registerPrefsWindow } from "./modules/prefsWindow"
import { registerShortcuts } from "./modules/shortcuts"
import { registerReaderListeners } from "./modules/reader"
import { getString, initLocale } from "./modules/utils/locale"
import { checkAndReportStatus, initEngines } from "./modules/tts"
import { getSelectedText, getSelectedAnnotations } from "./modules/utils/readerUtils";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ])

  await initEngines(addon)

  initLocale()

  setDefaultPrefs()

  await onMainWindowLoad(window)
}

async function onMainWindowLoad(win: Window): Promise<void> {
  await new Promise((resolve) => {
    if (win.document.readyState !== "complete") {
      win.document.addEventListener("readystatechange", () => {
        if (win.document.readyState === "complete") {
          resolve(void 0)
        }
      })
    }
    resolve(void 0)
  })

  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ])

  // TODO: optim - create custom toolkit to minify
  addon.data.ztoolkit = new ZoteroToolkit()

  // TODO: l10n - implement locale appending
  // (win as any).MozXULElement.insertFTLIfNeeded(
  //     `${config.addonRef}-mainWindow.ftl`,
  // )

  if (addon.data.tts.status === "ready") {
    registerPrefsWindow()
    registerMenu()
    registerShortcuts()
    await registerReaderListeners()
  } else if (addon.data.tts.status === "error") {
    checkAndReportStatus()
  }
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll()

  // TODO: l10n - implement locale removal
  // win.document
  //     .querySelector(`[href="${config.addonRef}-mainWindow.ftl"]`)
  //     ?.remove()
}

function onShutdown(): void {
  ztoolkit.unregisterAll()
  // Remove addon object
  addon.data.alive = false
  delete Zotero[config.addonInstance]
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise, the code would be hard to read and maintain.

// TODO: future: preformat text before speaking?
//   WSA on windows can be a little rough (eg pronouncing "a/b" as "a forward slash b", etc)
//   might be nice to reformat text into a better form, might have to be managed by each engine internally
function onSpeak(text: string) {
  if (checkAndReportStatus()) {
    addon.data.tts.engines[addon.data.tts.current].speak(text)
  }
}

function onStop() {
  if (checkAndReportStatus()) {
    addon.data.tts.engines[addon.data.tts.current].stop()
  }
}

// TODO: future - implement skipping to next as well as cancelling all

function onPause() {
  if (checkAndReportStatus()) {
    if (addon.data.tts.engines[addon.data.tts.current].canPause) {
      // @ts-ignore
      addon.data.tts.engines[addon.data.tts.current].pause()
    }
  }
}

function onResume() {
  if (checkAndReportStatus()) {
    if (addon.data.tts.engines[addon.data.tts.current].canPause) {
      // @ts-ignore
      addon.data.tts.engines[addon.data.tts.current].resume()
    }
  }
}

// for speaking using shortcuts and UI elements not specifically tied to any text (eg text selection popup)
function onContextualSpeak(shiftHeld?: boolean) {
  if (Zotero_Tabs.selectedType == "library") {
    // library tab context

    let items = Zotero.getActiveZoteroPane().getSelectedItems()
    // TODO: future - add extra handling for other item types?

    let swap: boolean
    if (shiftHeld === undefined) {
      swap = false
    } else {
      swap = shiftHeld !== (getPref("shortcuts.swapLibraryItem") === "true")
    }

    if (items.length === 0) {
      // if none selected, skip
      return
    } else if ((items.length === 1) ||
        (items.length > 1 && getPref("newItemBehaviour") === "cancel")) {
      // if single item, or if multiple items but queue disabled, just read first

      let text = swap ? items[0].getField("abstractNote") : items[0].getDisplayTitle()
      addon.hooks.onSpeak(text)
    } else {
      // if multiple items and queue enabled, read all

      items.forEach((i) => {
        let text = swap ? i.getField("abstractNote") : i.getDisplayTitle()
        addon.hooks.onSpeak(text)
      })
    }
  } else {
    // reader tab context

    // TODO: future - add code for reading paper text if no selection or annotation?

    let reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)
    if (reader === undefined) {
      return
    }

    if (ztoolkit.Reader.getSelectedText(reader) !== "") {
      // if text selected, read

      let text = getSelectedText(reader)
      addon.hooks.onSpeak(text)
    }

    let selectedAnnos = getSelectedAnnotations(reader)

    let swap: boolean
    if (shiftHeld === undefined) {
      swap = false
    } else {
      swap = shiftHeld !== (getPref("shortcuts.swapAnnotation") === "true")
    }

    if ((selectedAnnos.length === 1) ||
        (selectedAnnos.length > 1 && getPref("newItemBehaviour") === "cancel")) {
      // if single anno, or if multiple anno and queue disabled, just read first

      let text = swap ? selectedAnnos[0].comment : selectedAnnos[0].text
      addon.hooks.onSpeak(text || "")
    } else {
      // if multiple annotation and queue enabled, read all

      selectedAnnos.forEach((a) => {
        let text = swap ? a.comment: a.text
        addon.hooks.onSpeak(text || "")
      })
    }
  }
}

function onSpeakOrResume(shiftHeld?: boolean) {
  if (addon.data.tts.state === "paused") {
    onResume()
  } else {
    onContextualSpeak(shiftHeld)
  }
}

// used in prefs window to test voice without having to switch back and forth
function onSpeakTest() {
  onSpeak(getString("speak-testVoice"))
}

function onPrefsLoad(type: string, doc: Document) {
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

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onSpeak,
  onStop,
  onPause,
  onResume,
  onContextualSpeak,
  onSpeakOrResume,
  onSpeakTest,
  onPrefsLoad,
}