itemMenu-title = Speak Title
itemMenu-abstract = Speak Abstract

textPopup-selection = Speak Selection

anno-annotation = Anno.
anno-comment = Comm.

speak-testVoice = This is an example sentence using the current voice and other settings.

status-allGood =
    Loaded and initialised successfully
status-ttsLoading =
    NOTICE: ZoTTS is still loading TTS engines.
    Please be patient or submit a bug report if error persists.
status-ttsError =
    ERROR: ZoTTS failed to load TTS engines.
    Please submit a bug report for assistance.
status-addonLoading =
    NOTICE: TTS engine "{ $engineName }" is still loading.
    Please be patient or submit a bug report if error persists.
status-addonError =
    ERROR: TTS engine "{ $engineName }" failed to load.
    Please submit a bug report.

# TODO: future - new engine error reporting needs to go here
status-errorCause =
    Cause: { $engine ->
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