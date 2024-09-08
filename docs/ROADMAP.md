# Roadmap
This file describes a rough outline for features I plan to add to ZoTTS at some point. I have my own private project management system for tracking these ideas more fully with technical details, this is intended as a way to share those plans with users.

Please note, just because something is listed here doesn't *guarantee* it will be added at some point. Similarly, even if something will be added, the fact that it is listed here doesn't mean it will be in a timely manner. However much I might like to work on features, this is an unpaid side project at the end of the day. This document should be considered more *aspirational* than prescriptive.

That said, if you are a developer and would like to contribute with any of these, please reach out and I'd be glad to collaborate/share my plans with you!

# Priority Features
These are features I'm very keen on adding, either because of my own use cases, user requests, or both. 

## Highlighting
ZoTTS currently doesn't show what text it's reading within the paper, however in other programs with TTS capabilities they will highlight both the *whole text* being spoken as well as the *specific word*.

Note: currently this feature is blocked due to implementation issues, see [this discussion with the Zotero devs google group](https://groups.google.com/g/zotero-dev/c/lj_thX_5P2Y) for further details (non-technical users: to reduce clutter and distractions, please *don't* comment in that group, you're very welcome to open an issue here if you want to discuss this feature).

# Other Features
These are features I want to add but that aren't immediate priorities.

## Add "Refresh Voices" Button to Preferences
Rarely the users might want to refresh the available voices without restarting Zotero, this would be useful for that. 

## Implement Skipping
Currently there's no way to skip the current utterance and start the next one (so long as queueing is enabled), the user can only cancel the whole queue. It would be better to maintain an internal queue instead.

## Implement History
Once an utterance has finished, it's impossible to play it again without re creating it (which is especially tiresome with the current text selection limitation), it would be nice to keep a record of the previous utterances so they could be replayed (probably also requiring adding a reader tab sidebar section).

## Implement Fast Forwarding/Rewinding
Once an utterances has begun, the user can only play/pause/cancel it, with no option to go back/forward an amount of seconds.

# Distant Future Features
These features are either very low priority, or are very different to what ZoTTS currently does, and as such, they are very low priority right now. 

## Optimisation
The plugin framework ZoTTS uses is very very broad and ZoTTS doesn't use many of the features in it, it would be good to reduce the codebase slightly for efficiency reasons. 

Low priority since ZoTTS is still in the growing phase so it's more useful to have all of those features to hand for now. 

## Speech to Text
A couple of users have expressed interest in using STT to add annotations to papers (particularly useful if it can be done mid utterance). This seems to be absolutely possible since Zotero provides the SpeechRecognition API from Firefox (only behind a preference but that can be changed), however it's low priority due to being a different type of feature to the TTS, implementing this would distract current efforts.

## Audio Saving
Currently ZoTTS regenerates the TTS utterance every time it's called, this has several notable drawbacks:
- These audio recordings can't be taken away from ZoTTS for external listening
- This creates unnecessary overhead for repeated listening

It would be nice to be able to save an utterance for these reasons. This feature is low priority due to being *impossible* with the TTS engine ZoTTS currently uses (Web Speech API), meaning this feature would likely also require implementing another TTS engine.