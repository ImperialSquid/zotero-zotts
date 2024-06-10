import {ttsEngineBase, ttsMixin} from "./ttsBase";

const VOICES_UNAVAILABLE = "Voice selection unavailable";

export class ttsWindows extends ttsMixin implements ttsEngineBase {
    canPause: boolean;

    constructor() {
        super();
        this.canPause = false;
    }

    getVoices(): Array<string> {
        throw new Error("Not implemented");
    }

    setVoice(newVoices: string): void {
        throw new Error("Not implemented");
    }

    speak(input: string): void {
        throw new Error("Not implemented");
    }

    stop(): void {
        throw new Error("Not implemented");
    }
}

export class ttsMacOS extends ttsMixin implements ttsEngineBase {
    canPause: boolean;

    constructor() {
        super();
        this.canPause = false;
    }

    getVoices(): Array<string> {
        throw new Error("Not implemented");
    }

    setVoice(newVoices: string): void {
        throw new Error("Not implemented");
    }

    speak(input: string): void {
        throw new Error("Not implemented");
    }

    stop(): void {
        throw new Error("Not implemented");
    }
}

export class ttsLinux extends ttsMixin implements ttsEngineBase {
    canPause: boolean;

    constructor() {
        super();
        this.canPause = false;
    }

    getVoices(): Array<string> {
        throw new Error("Not implemented");
    }

    setVoice(newVoices: string): void {
        throw new Error("Not implemented");
    }

    speak(input: string): void {
        throw new Error("Not implemented");
    }

    stop(): void {
        throw new Error("Not implemented");
    }
}

// Future code snippets for getting output from a command line process, taken from zotero scaffold.js
//
// let outputFile = OS.Path.join(
//     Zotero.getTempDirectory().path,
//     `lint_output_${Zotero.Utilities.randomString()}.txt`
// );
//
// // Create a file object for the executable
// const file = Components.classes["@mozilla.org/file/local;1"]
//     .createInstance(Components.interfaces.nsIFile);
// file.initWithPath("C:\\Windows\\System32\\cmd.exe");
//
// // Create a process object for the executable
// const process = Components.classes["@mozilla.org/process/util;1"]
//     .createInstance(Components.interfaces.nsIProcess);
// process.init(file);
//
// // Set the arguments for the command line
// const args = ["/c", "cd", ">", outputFile];
//
// // Create an observer object for the process
// const observer = {
//     observe: function (subject: typeof process, topic: string, data: any) {
//         if (topic == "process-finished") {
//             // The process has finished
//             var exitval = process.exitValue; // Get the exit value
//             ztoolkit.log("The process exited with code " + exitval);
//             ztoolkit.log("The process output is " + data);
//             ztoolkit.log("The process output is " + subject);
//             // Your callback here
//         } else if (topic == "process-failed") {
//             // The process failed to launch or was killed
//             ztoolkit.log("The process failed");
//         }
//     }
// };
//
// // Run the process asynchronously and pass the observer
// process.runAsync(args, args.length, observer);