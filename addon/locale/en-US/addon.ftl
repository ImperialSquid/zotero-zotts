## UI Elements
itemMenu-title = Speak Title
itemMenu-abstract = Speak Abstract

textPopup-selection = Speak Selection

anno-annotation = Anno.
anno-comment = Comm.

# used in prefs menu when testing voice
speak-testVoice = This is an example sentence using the current voice and other settings.

## Popups
popup-allGood = Loaded and initialised successfully

popup-addonLoadingTitle = NOTICE: ZoTTS is still loading
popup-addonErrorTitle = ERROR: ZoTTS encountered an error

# TODO - remove manual addonRef prefix after updating zotero-plugin-scaffold
# see https://github.com/windingwind/zotero-plugin-toolkit/issues/77
popup-engineLoadingTitle = NOTICE: { zotts-ttsEngine-engineName } is still loading
popup-engineErrorTitle = ERROR: { zotts-ttsEngine-engineName } encountered an error

popup-engineErrorCause = Cause: { zotts-ttsEngine-errorCause }

popup-loadingTrailer = Please be patient or submit a bug report if error persists
popup-errorTrailer = Please submit a bug report


## TTS l10n helpers
# convert code names to human names
ttsEngine-engineName = { $engine ->
    *[other] Unknown Engine
    [webSpeech] Web Speech API
}

# convert error codes to human readable sentences
ttsEngine-errorCause = { $engine ->
    *[other] { $cause ->
        *[other] Unknown Error
    }
    [webSpeech] { $cause ->
        *[other] Unknown Error
        [canceled] Initialisation was cancelled
        [interrupted] Initialisation was interrupted
        [audio-busy] Audio service was busy (try restarting)
        [audio-hardware] Unable to identify audio device
        [synthesis-unavailable] No WSA engine available
        [synthesis-failed] WSA engine raised an error
        [not-allowed] WSA engine start is not allowed
        [no-voices-found] No voices are installed
    }
}