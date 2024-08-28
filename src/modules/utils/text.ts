import { getPref } from "../utils/prefs"

export function preprocessText(text: string) {
    text = universalPreprocess(text)

    text = userPreprocess(text)

    return text
}

// preprocessing that should occur on every piece of text to ensure consistency
// stuff like unicode encoding, removing double newlines, etc
function universalPreprocess(text: string) {
    text = text.normalize("NFC")

    return text
}

// user defined preprocessing, will include substitutions and anything else that uses
// inputs defined by the user as well as text from the paper
function userPreprocess(text: string) {
    // TODO: future: preformat text before speaking?
    //   WSA on windows can be a little rough (eg pronouncing "a/b" as "a forward slash b", etc)
    
    // TODO: implement some kind of preference for this
    // if (getPref("webSpeech.noParenthesis") as Boolean == false){
    text = text.replace(/ *\([^)]*\) */g, "");
    // }
    return text

    // TODO: implement some kind of preference for this
    // if (getPref("webSpeech.noParenthesis") as Boolean == false){
    text = text.replace(/ *\([^)]*\) */g, "");
    // }
}