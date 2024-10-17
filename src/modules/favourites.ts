import { getPref, setPref } from "./utils/prefs";

function cycleFavourites() {
    let faves: { [key: string]: string | number | boolean }[]
        = JSON.parse(getPref("favouritesList") as string)

    if (faves.length === 0) {
        // no faves set, so return out
        return
    }

    const currSettings = constructFav()
    // if current settings aren't in favourites, findIndex returns a -1, turned into a 0,
    // so we default to the first favourite always
    const index = faves.findIndex((f) => compareFav(f, currSettings))
    const newSettings = faves[(index + 1) % faves.length]

    // set new engine, then cycle through the rest of the keys an set values
    setPref("ttsEngine.current", (newSettings["engine"] as string))
    Object.keys(newSettings).forEach((key) => {
        if (key === "engine") {
            return
        }
        setPref(`${newSettings["engine"]}.${key}`, newSettings[key])
    })
}

function addFavourite() {
    let faves: { [key: string]: string | number | boolean }[]
        = JSON.parse(getPref("favouritesList") as string)

    const favToAdd = constructFav()

    if (! faves.some(f => { return compareFav(f, favToAdd) })) {
        faves.push(favToAdd)
        setPref("favouritesList", JSON.stringify(faves))
    }
}

function removeFavourite(
    favToRemove: { [key: string]: string | number | boolean }
) {
    let faves: { [key: string]: string | number | boolean }[]
        = JSON.parse(getPref("favouritesList") as string)

    faves = faves.filter(f => {
        return ! compareFav(f, favToRemove)
    })

    setPref("favouritesList", JSON.stringify(faves))
}

function constructFav() {
    let newFav: { [key: string]: string | number | boolean } = {}

    newFav["engine"] = (getPref("ttsEngine.current") as string)

    // TODO: future - new engines need to reference required values here
    switch (getPref("ttsEngine.current")) {
        case "webSpeech":  // WSA
            newFav["voice"] = (getPref("webSpeech.voice") as string)
            newFav["pitch"] = (getPref("webSpeech.pitch") as number)
            newFav["rate"] = (getPref("webSpeech.rate") as number)
            newFav["volume"] = (getPref("webSpeech.volume") as number)
            break
    }

    return newFav
}

function compareFav(
    arg1: {[key: string]: string | number | boolean},
    arg2: {[key: string]: string | number | boolean}
): boolean {
    if (Object.keys(arg1).length !== Object.keys(arg2).length) {
        return false
    }

    const keys = Object.keys(arg1).concat(Object.keys(arg2))
    return keys.every((key: string) => arg1[key] === arg2[key])
}

export {
    cycleFavourites,
    addFavourite,
    removeFavourite
}