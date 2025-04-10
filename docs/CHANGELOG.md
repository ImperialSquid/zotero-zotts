# Changelog
This file is intended as a human-readable non-technical summary of the changes in each ZoTTS release

# Releases
## v1.0.0 - ZoTTS's first release! 🎉
*Released 20/07/2024*
- Speaking paper title/abstracts in the library tab
- Right click context menu items to access the above
- Speaking annotation text/comments in any reader tabs
- Speaking a highlighted portion of text within papers
- UI elements in the reader tab to control playing/pausing/cancelling
- Shortcuts to control playing/pausing/cancelling
- Adjustable settings for the TTS engine
- Settings for other elements of the plugin

## v1.0.1
*Released 20/07/2024*
- A minor build update

## v1.1.0
*Released 24/07/2024*
- Implemented localisation so if users wanted to help contribute languages in the future they easily can

## v1.1.1
*Released 27/07/2024*
- A minor stability update to attempt to combat repeated issues users were having on Mac/Linux machines

## v1.2.0
*Released 17/08/2024*
- A more major stability overhaul, both to reduce buggy behaviour, and to reduce user confusion
- ZoTTS shouldn't load any UI elements/shortcuts/menu items/etc *until* it's ready to speak
- Added notifications in case ZoTTS fails to load so the user isn't left wondering

## v1.2.1
*Released 24/08/2024*
- Fixes a bug where selected text with diacritics might not be spoken correctly
- Lots of documentation changes, should make knowing the state of development and reporting issues much easier.

## v1.3.0
*Released 08/09/2024*
- Added the ability to read the full text of a paper (done when no annotations and no text are selected)
- Added the ability to specify substitutions for the text to be spoken in the preferences (can be either a raw string or a regex pattern)
- Added status reporting, including better error reporting for WSA
- Added voice list sorting for readability (thanks to contributor @flightmansam!)

## v1.4.0
*Released 10/11/2024*
- Added favourites, giving users ability to switch voices quickly (useful for those that read papers in multiple languages)
- Fixed inability to pause speech on linux machine

## 1.4.1
*Released 03/02/2025*
- Fixed Zotero version compatibility mismatch

## 1.4.2
*Released 10/02/2025*
- Fixed secret setting that allows users to reload TTS engines more times

## 1.5.0
*Released 06/04/2025*
- Added the ability to "speak from here" in a paper
- Reverted the decision to not load UI elements if the plugin failed to load
- Added much better notifications (partly to allow for both of the above in terms of user feedback)
- WSA now reports its status in the preferences menu (also allows for easier debugging and support on my end)