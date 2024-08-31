import { validateSubs } from "../prefsWindow"
import { getPref } from "./prefs";

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
    let subs = validateSubs(getPref("subs.customSubs") as string).subs

    for (let sub of subs) {
        let pattern: string | RegExp
        if (sub[2] === "regex") {
            pattern = new RegExp(sub[0], "g")
        } else {
            pattern = sub[0]
        }

        text = text.replaceAll(pattern, sub[1])
    }

    return text
}