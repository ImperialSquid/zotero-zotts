var audioContext = new window.AudioContext();
var playbackLoop = setInterval(() => {}, 1000)
clearInterval(playbackLoop)

async function getAudio(text: string) {
    return Zotero.HTTP.request("GET", `http://localhost:5002/api/tts?text=${encodeURI(text)}`, {"responseType": "arraybuffer", "timeout":120000})
    .then((request) => request.response)
    .then((buff) => audioContext.decodeAudioData(buff))
}


async function speak(text: string) {
    if (audioContext.state == "closed") audioContext = new window.AudioContext();
    var sentences = text.match( /[^\.!\?]+[\.!\?]+/g ) ?? [text]
    var sentences_buff: Record<number, AudioBuffer> = []
    sentences.forEach((v, i) => {getAudio(v.trim()).then((buff) => sentences_buff[i]=buff)})

    var currentSource: AudioBufferSourceNode;
    var endTime = 0;
    const qued_idxs: number[] = []
    
    var current_idx = 0 
    playbackLoop = setInterval(() => {
        // Zotero.log(`end: ${endTime}`)
        // Zotero.log(`now: ${audioContext.currentTime}`)

        if (current_idx >= sentences.length - 1) {
            clearInterval(playbackLoop)
            // Zotero.log("done.")
        }

        if ((current_idx in sentences_buff) && !(current_idx in qued_idxs)) {
            currentSource = audioContext.createBufferSource();
            currentSource.buffer = sentences_buff[current_idx]
            qued_idxs.push(current_idx)
        }

        if (currentSource) {
            if ((audioContext.currentTime > endTime) || (current_idx == 0)) {
                currentSource.connect(audioContext.destination)
                currentSource.start()
                endTime = audioContext.currentTime + sentences_buff[current_idx].duration
                current_idx++;
            }
        }

    }, 500)

    // Zotero.log("intervalling")
    
}

function stop() {
    audioContext.close()
    clearInterval(playbackLoop)
}

function pause() {
    audioContext.suspend()
}

function resume() {
    audioContext.resume()
}

export {
    speak,
    stop,
    pause,
    resume,
}