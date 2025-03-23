import { ZoteroToolkit } from "zotero-plugin-toolkit"
import hooks from "./hooks"
import { TTSEngine } from "./modules/tts";

class Addon {
  public data: {
    alive: boolean
    // Env type, see build.js
    env: "development" | "production"
    // ztoolkit: MyToolkit
    ztoolkit: ZoteroToolkit
    locale?: {
      current: any
    }
    ui: {
      toolbars: Array<HTMLDivElement>
    }
    tts: {
      current: string
      // TODO: future - need to add engine change hooks to gracefully cancel and
      //   change state if paused when engine changes
      // each engine is responsible for managing changes to this state internally
      state: "idle" | "playing" | "paused"
      status: "loading" | "ready" | "error"
      engines: {
        [key: string]: TTSEngine  // see src/modules/tts/index.ts
      }
    }
  }
  // Lifecycle hooks
  public hooks: typeof hooks
  // APIs
  public api: {}

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      // ztoolkit: new MyToolkit(),
      ztoolkit: new ZoteroToolkit(),
      ui: {
        toolbars: []
      },
      tts: {
        current: "",
        state: "idle",
        status: "loading",
        engines: {}
      }
    }
    this.hooks = hooks
    this.api = {}
  }
}

/**
 * Alternatively, import toolkit modules you use to minify the plugin size.
 *
 * Steps to replace the default `ztoolkit: ZoteroToolkit` with your `ztoolkit: MyToolkit`:
 *
 * 1. Uncomment this file's line 30:            `ztoolkit: new MyToolkit(),`
 *    and comment line 31:                      `ztoolkit: new ZoteroToolkit(),`.
 * 2. Uncomment this file's line 10:            `ztoolkit: MyToolkit;` in this file
 *    and comment line 11:                      `ztoolkit: ZoteroToolkit;`.
 * 3. Uncomment `./typing/global.d.ts` line 12: `declare const ztoolkit: import("../src/addon").MyToolkit;`
 *    and comment line 13:                      `declare const ztoolkit: import("zotero-plugin-toolkit").ZoteroToolkit;`.
 *
 * You can now add the modules under the `MyToolkit` class.
 */

// TODO: optim - create custom toolkit to minify
// import { BasicTool, unregister } from "zotero-plugin-toolkit/dist/basic"
// import { UITool } from "zotero-plugin-toolkit/dist/tools/ui"
// import { PreferencePaneManager } from "zotero-plugin-toolkit/dist/managers/preferencePane"
//
// export class MyToolkit extends BasicTool {
//   UI: UITool
//   PreferencePane: PreferencePaneManager
//
//   constructor() {
//     super()
//     this.UI = new UITool(this)
//     this.PreferencePane = new PreferencePaneManager(this)
//   }
//
//   unregisterAll() {
//     unregister(this)
//   }
// }

export default Addon
