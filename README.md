# ![](addon/chrome/content/icons/favicon@48.svg) ZoTTS
ZoTTS is a Zotero plugin to add TTS functionality

[![Zotero target version 7](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

## Install :rocket:

> The latest stable version is available [here](https://github.com/ImperialSquid/zotero-zotts/releases/latest)
> The full version list, including any prerelease versions is [here](https://github.com/ImperialSquid/zotero-zotts/releases)

1. Download the .xpi file from the [latest release](https://github.com/ImperialSquid/zotero-zotts/releases)
   - If you're using firefox, right click and select "Save as..."
2. In Zotero, go to `Tools > Plugins`
3. Click the gear icon in the top right
4. Select `Install Add-on From File...`
5. Browse to the downloaded .xpi file and select it

The plugin should load straight away, and future updates will be downloaded automatically!

> [!NOTE]
> ZoTTS might fail to init the TTS engine for Linux users who use Zotero in sandboxed environments (flatpak/snap/etc) due to a long-standing non-trivial bug, a workaround might be possible but you might find it easier to use a non-sandboxed Zotero if you can, feel free to open a bug report for further assistance

## Features :sparkles:
### Shortcuts
- `Ctrl/Cmd + S` will begin **s**peaking (extra functionality is available with `Ctrl/Cmd + Shift + S`, discussed below)
- `Ctrl/Cmd + Shift + P` will **p**ause
- `Ctrl/Cmd + Shift + C` will **c**ancel

In the Library tab, by default `Ctrl/Cmd + S` will speak a paper's title, `Ctrl/Cmd + Shift + S` will speak its abstract.

In Reader tabs, `Ctrl/Cmd (+ Shift) + S` will speak the full text of a paper. If you have any text selected within the document, it will read that instead. If no text is selected but some annotations are selected `Ctrl/Cmd + S` will speak their annotated text, `Ctrl/Cmd + Shift + S` will speak the attached comment if there is one.

You can swap the behaviour of `Ctrl/Cmd + S` and `Ctrl/Cmd + Shift + S` in the preferences.

### UI Elements
In the Library tab, right clicking an item will bring up a context menu, you can tell ZoTTS to speak the title or abstract from here.

![](docs/resources/right-click-buttons.png)

In Reader tabs there's also buttons for playing/pausing/cancelling in the top right. These will act the same as using the speak/pause/cancel shortcuts in terms of speaking selected text/annotations, however, when speaking annotations it will default to speaking the annotated text.

![](docs/resources/play-pause-cancel-buttons.png)

On each annotation there are also buttons to speak the annotated text, and the comment if one exists.

![](docs/resources/anno-comm-buttons.png)

### Preferences
In the preferences you can:
- **Enable/disable queueing** - if you want to speak a new item, should ZoTTS add it to a queue, or cancel the current item and speak the new one?
- **Adjust the current voice and related settings**
  - Voices used are the ones built in to your computer
  - You can also adjust the rate/pitch/volume
- **Tweak shortcuts**
  - Rebind the speak, pause and cancel shortcuts to use other letters
  - Change what happens when you're holding `Ctrl/Cmd` vs `Ctrl/Cmd + Shift`
- **Specify substitutions**
   - A lot of TTS engines don't pronouce things how you might want, you can tell ZoTTS text to look out for and what to replace it with
   - Patterns to be replaced can be either raw strings or regex patterns

## Contributing :wrench:
Refer to the [contribution guide](docs/CONTRIBUTING.md) for details on setting up your environment and places to start!
