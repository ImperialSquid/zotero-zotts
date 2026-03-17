import { config } from "../package.json"
import { setDefaultPrefs } from "./modules/utils/prefs"
import { ZoteroToolkit } from "zotero-plugin-toolkit"
import { registerMenu } from "./modules/menu"
import { prefsLoadHook, prefsRefreshHook, registerPrefsWindow } from "./modules/prefsWindow"
import { registerShortcuts } from "./modules/shortcuts"
import { registerReaderListeners } from "./modules/reader"
import { cycleFavourites } from "./modules/favourites";
import { initLocale } from "./modules/utils/locale"
import { initEngines, checkStatus } from "./modules/tts"
import { speak, stop, pause, resume, speakOrResume, speakTest, speedChange } from "./modules/tts/ttsHooks";
import { loadIcons } from "./modules/utils/icons";
import { notifyStatus } from "./modules/utils/notify";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ])

  setDefaultPrefs()

  await initEngines(addon)

  initLocale()

  await loadIcons()

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  )
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

  // if (checkStatus()) {
    registerPrefsWindow()
    registerMenu()
    registerShortcuts()
    registerReaderListeners()
  // }

  notifyStatus()  // report ready or error status as soon as possible
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

  // Clean up TTS engines
  for (const engineName in addon.data.tts.engines) {
    const engine = addon.data.tts.engines[engineName]
    if (engine?.extras?.dispose) {
      try {
        engine.extras.dispose()
      } catch (error) {
        ztoolkit.log(`Error disposing ${engineName} engine: ${error}`)
      }
    }
  }

  // Remove addon object
  addon.data.alive = false
  // @ts-ignore - Plugin instance is not typed
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

const onSpeedChange = speedChange

const onCycleFavourite = cycleFavourites

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
  onSpeedChange,
  onCycleFavourite,
  onPrefsLoad,
  onPrefsRefresh
}