# === General
pref-sect-general = General

pref-general-queue-label =
    .value = When attempting to play multiple items:
pref-general-queue-disable =
    .label = Cancel anything currently playing
pref-general-queue-enable =
    .label = Add new item to a queue

# === WSA
pref-sect-wsa = Web Speech

pref-wsa-voice = Current Voice
pref-wsa-volume = Volume
pref-wsa-rate = Rate
pref-wsa-pitch = Pitch
pref-wsa-testVoice = Test Voice

# === Shortcuts
pref-sect-shortcuts = Shortcuts

# --- Keys
pref-subsect-shortcuts-keys = Shortcut Keys

pref-shortcuts-speak = Speak
pref-shortcuts-pause = Pause
pref-shortcuts-cancel = Cancel

# --- Shift Modifier
pref-subsect-shortcuts-shiftMod = Shift Modifier

pref-shiftMod-p1 = You can change whether ZoTTS will read the title/abstract of library items and the text/comment of annotations by holding Shift.
pref-shiftMod-p2 = Select what ZoTTS should do when <em>not</em> holding Shift

pref-shiftMod-swapLib = When speaking a library item:
pref-shiftMod-swapLib-false =
    .label = Speak title
pref-shiftMod-swapLib-true =
    .label = Speak abstract

pref-shiftMod-swapAnno = When speaking an annotation:
pref-shiftMod-swapAnno-false =
    .label = Speak annotated text
pref-shiftMod-swapAnno-true =
    .label = Speak attached comment

# === Advanced
pref-sect-advanced = Advanced

# --- Substitutions
pref-subsect-advanced-subs = Substitutions

pref-subs-p1 = Specify substitutions for the text to be spoken to allow for better listening.
pref-subs-p2 = Substitutions are specified as <em>"pattern":"substitution"</em>. Users wishing to use regex can use <em>/pattern/:"substitution"</em>.

pref-subs-placeholder =
    .placeholder = For example:
              You can replace symbols
                  ">":"greater than"
              Or do more complex matching, eg to remove email adresses
                  /\S*?@\S*/:""
              You can also use regex capture groups
                  /\d*?\/\d*/:"$1 divided $2"

pref-subs-save = Save Substitutions

pref-subs-warning = { $count ->
    [1] Found error on line: { $lines }
   *[other] Found error on lines: { $lines }
}