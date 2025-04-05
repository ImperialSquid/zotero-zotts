## TTS l10n helpers
# convert code names to human names
ttsEngine-engineName = { $engine ->
    [webSpeech] Web Speech API
    *[other] Unknown Engine
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
