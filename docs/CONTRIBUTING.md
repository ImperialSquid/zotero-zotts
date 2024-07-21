Thanks for expressing an interest in contributing to ZoTTS!

# Setting up Your Environment
1. Install [git](https://git-scm.com/) and [Node.js](https://nodejs.org/en/) if you haven't.
2. Download Zotero 7 if you haven't, available [here](https://www.zotero.org/support/beta_builds)
3. This addon is based on the [windingwind](https://github.com/windingwind)'s excellent [zotero plugin template](https://github.com/windingwind/zotero-plugin-template). Familiarising yourself with its structure and tools will help you a lot.
4. Clone and build a local version of the plugin:

```shell
git clone https://github.com/ImperialSquid/zotero-zotts.git
cd zotero-zotts
npm install
npm run build
```
5. You're ready to start!

## Adding Translations
> [!NOTE]
> Currently this is on hold since the very first version doesn't make use of localisation

1. Navigate to addon > chrome > locale
2. Copy the en-US folder
3. Rename it to the [corresponding code](https://www.andiamo.co.uk/resources/iso-language-codes/) for the target language
   - The second pair of letter should be capitalised eg "en-US" for American English
   - If the code doesn't have two parts, repeat the first two letters eg "tr-TR" for Turkish
4. Translate the text in each `.ftl` file
   - Fluent syntax guide is [here](https://projectfluent.org/fluent/guide/)
5. Create a pull request

## Adding TTS Engines
The default Web Speech API engine is nice because it's completely offline, already built-in, and fairly lightweight, however it's not the most natural sounding.

Engines are stored in the [src/modules/tts](../src/modules/tts) folder. Each engine has it's own `.ts` file, and they are registered in [index.ts](../src/modules/tts/index.ts).

Each engine needs to register the following details:
- `name` - The user-friendly name of the engine
- `speak` - To be called when speaking, must accept a string
- `stop` - To be called when cancelling
- `canPause` - A boolean value stating whether the engine supports pausing
- `pause` - To be called when pausing, must be defined if `canPause` is true, can be left undefined otherwise
- `resume` - To be called when resuming, must be defined if `canPause` is true, can be left undefined otherwise
- `extras` - Any extra functions/data to be used throughout ZoTTS (eg for listing available voices in preferences pane), can be empty

Engines shouldn't store data outside of `extras` for simplicity, any data that needs to be persisted (like voice settings) should be registered and stored in the preference ([prefs utils](../src/modules/utils/prefs.ts))

You should also modify the [preference pane](../addon/chrome/content/preferences.xhtml) with any relevant settings for the user.