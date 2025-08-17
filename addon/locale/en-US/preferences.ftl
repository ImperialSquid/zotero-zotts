# === General
pref-sect-general = General

pref-general-queue-label =
    .value = When attempting to play multiple items:
pref-general-queue-disable =
    .label = Cancel anything currently playing
pref-general-queue-enable =
    .label = Add new item to a queue

# === TTS General
pref-status-unknown =
    Status: Unknown.<br>
    Please submit a bug report if you see this message.
pref-status-allGood =
    Status: { ttsEngine-engineName } is loaded and working normally.
pref-status-error =
    Status: { ttsEngine-engineName } encountered an error.<br>
    Cause: { ttsEngine-errorCause }

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
pref-shortcuts-cycleFav = Cycle favourites

# --- Shift Modifier
pref-subsect-shortcuts-shiftMod = Shift Modifier

pref-shiftMod-p1 = You can change whether ZoTTS will read the title/abstract of library items, the text/comment of annotations, and the selected text/eveything after it in the reader by holding Shift.
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

pref-shiftMod-swapSpeakSelection = When speaking a selection:
pref-shiftMod-swapSpeakSelection-false =
    .label = Speak just the selected text
pref-shiftMod-swapSpeakSelection-true =
    .label = Speak from the selected text to the end

# === Advanced
pref-sect-advanced = Advanced

# --- Substitutions
pref-subsect-advanced-subs = Substitutions

pref-subs-p1 = Specify substitutions/removals for the text to be spoken to allow for better listening.

pref-subs-citationsOverall = Remove citations
pref-subs-citationsParenthetical =
    Remove "parenthetical" style citations <br>
    <small><i>(In the form of (Author, Year, PageNo), used by APA, MLA, etc)</i></small>
pref-subs-citationsNumeric =
    Remove "numeric" style citations <br>
    <small><i>(In the form of [Number], used by IEEE, etc)</i></small>
pref-subs-emails = Remove email addresses
pref-subs-urls = Remove URLs
pref-subs-greekLetters =
    Fix Greek letters (eg ε -> "epsilon") <br>
    <small>(NOTE: Currently these are optimised for English, and only some voices,</small> <br>
    <small>please raise an issue on GitHub if things don't sound quite right)</small>

pref-subs-p2 =
    You can also manually specify substitutions.
    Substitutions are specified as <b>"pattern":"substitution"</b>.
    Users wishing to use regex can use <b>/pattern/:"substitution"</b>.
    Empty lines or those beginning with a hash (#) are ignored.

pref-subs-placeholder =
    .placeholder = For example:
              You can replace symbols
                  ">":"greater than"
              Or do more complex matching, eg to remove email adresses
                  /\S*?@\S*/:""
              You can also use regex capture groups
                  /(\d*?)\/(\d*)/:"$1 over $2"

pref-subs-warning = { $count ->
    [1] Found error on line: { $lines }
   *[other] Found error on lines: { $lines }
}

# --- Favourites
pref-subsect-advanced-faves = Favourites

pref-faves-p1 =
    Set favourites for quick switching between voices
    (useful for those who read in multiple languages).

pref-faves-addVoice = Add current voice to favourites

pref-faves-list = Favourites list

pref-faves-removeVoice = Remove selected voice
