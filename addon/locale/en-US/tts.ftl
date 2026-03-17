## TTS l10n helpers
# convert code names to human names
ttsEngine-engineName = { $engine ->
    [webSpeech] Web Speech
    [azure] Azure Speech
    *[other] Unknown Engine
}

# convert error codes to human readable sentences
ttsEngine-errorCause = { $engine ->
    *[other] { $cause ->
        *[other] Unknown Error
    }
    [webSpeech] { $cause ->
        *[other] Unknown Error
        [canceled] Initialization was cancelled
        [interrupted] Initialization was interrupted
        [audio-busy] Audio service was busy (try restarting)
        [audio-hardware] Unable to identify audio device
        [synthesis-unavailable] No WSA engine available
        [synthesis-failed] WSA engine raised an error
        [not-allowed] WSA engine start is not allowed
        [no-voices-found] No voices are installed
    }
    [azure] { $cause ->
        [config-incomplete] Language or voice not configured (select them in preferences)
        [auth-failed] Authentication failed (check subscription key)
        [connection-failed] Failed to connect to Azure service
        [connection-closed] Connection to Azure service was unexpectedly closed
        *[other] Unknown Error
    }
}

ttsEngine-settingsFormatted = { $engine ->
    *[other] Unable to list settings
    [webSpeech]
        Voice: { $voice },
        Volume: { $volume },
        Rate: { $rate },
        Pitch: { $pitch }
    [azure]
        Region: { $region },
        Language: { $language },
        Voice: { $voice },
        Volume: { $volume },
        Rate: { $rate }
}
# TODO: ui - popups seem to not respect newlines, find a way to format this?