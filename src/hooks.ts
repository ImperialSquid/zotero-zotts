import { config } from "../package.json"
import { setDefaultPrefs } from "./modules/utils/prefs"
import ZoteroToolkit from "zotero-plugin-toolkit/dist/index"
import { registerMenu } from "./modules/menu"
import { prefsLoadHook, prefsRefreshHook, registerPrefsWindow } from "./modules/prefsWindow"
import { registerShortcuts } from "./modules/shortcuts"
import { registerReaderListeners } from "./modules/reader"
import { initLocale } from "./modules/utils/locale"
import { initEngines, checkStatus, reportStatus } from "./modules/tts"
import { speak, stop, pause, resume, speakOrResume, speakTest } from "./modules/tts/ttsHooks";

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

  if (checkStatus()) {
    registerPrefsWindow()
    registerMenu()
    registerShortcuts()
    await registerReaderListeners()
  }

  reportStatus()  // report ready or error status as soon as possible
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
let onSpeak = speak

const onStop = stop

const onPause = pause

const onResume = resume

const onSpeakOrResume = speakOrResume

const onSpeakTest = speakTest

const onPrefsLoad = prefsLoadHook

const onPrefsRefresh = prefsRefreshHook

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onSpeak,
  onStop,
  onPause,
  onResume,
  onSpeakOrResume,
  onSpeakTest,
  onPrefsLoad,
  onPrefsRefresh
}