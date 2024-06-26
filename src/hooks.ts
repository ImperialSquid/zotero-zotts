import { config } from "../package.json";
import { getString, initLocale } from "./modules/utils/locale";
import { setDefaultPrefs} from "./modules/utils/prefs";
import {waitUntil, waitUtilAsync} from "./modules/utils/wait";
import ZoteroToolkit from "zotero-plugin-toolkit/dist/index";
import { registerMenu } from "./modules/menu";
import { registerPrefsWindow } from "./modules/prefsWindow";
import { registerShortcuts } from "./modules/shortcuts";
import { registerReaderListeners } from "./modules/reader";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // TODO: implement locale initialization
  // initLocale();

  setDefaultPrefs();

  registerShortcuts();

  await registerReaderListeners();

  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  await new Promise((resolve) => {
    if (win.document.readyState !== "complete") {
      win.document.addEventListener("readystatechange", () => {
        if (win.document.readyState === "complete") {
          resolve(void 0);
        }
      });
    }
    resolve(void 0);
  });

  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // TODO: optim - create custom toolkit to minify
  addon.data.ztoolkit = new ZoteroToolkit();

  // TODO: l10n - implement locale appending
  // (win as any).MozXULElement.insertFTLIfNeeded(
  //     `${config.addonRef}-mainWindow.ftl`,
  // );

  registerPrefsWindow();

  registerMenu();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();

  // TODO: l10n - implement locale removal
  // win.document
  //     .querySelector(`[href="${config.addonRef}-mainWindow.ftl"]`)
  //     ?.remove();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

function onSpeak(text: string) {
  ztoolkit.log(`Speaking: ${text}`);

  addon.data.tts.engines[addon.data.tts.current].speak(text);
}

function onStop() {
  addon.data.tts.engines[addon.data.tts.current].stop();
}

// TODO: future - implement skipping to next as well as cancelling all

function onPause() {
  if (addon.data.tts.engines[addon.data.tts.current].canPause) {
    // @ts-ignore
    addon.data.tts.engines[addon.data.tts.current].pause();
  }
}

function onResume() {
  if (addon.data.tts.engines[addon.data.tts.current].canPause) {
    // @ts-ignore
    addon.data.tts.engines[addon.data.tts.current].resume();
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
};
