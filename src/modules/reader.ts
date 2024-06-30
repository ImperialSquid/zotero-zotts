import { config } from "../../package.json";

export async function registerReaderListeners() {
    // fetching the icon rather than hard coding it allows for better stylistic
    // changes without massively changing the code
    let speakIcon: string;
    await fetch(`chrome://${config.addonRef}/content/icons/speak@16.svg`)
        .then((res) => res.text())
        .then((text) => {speakIcon = text})

    Zotero.Reader.registerEventListener(
        "renderTextSelectionPopup",
        (event) => {
            const { reader, doc, params, append } = event;
            let speakSelectionButton = ztoolkit.UI.createElement(doc, "div",
                {
                    children: [
                        {
                            tag: "div",
                            properties: {
                                innerHTML: `${speakIcon}`
                            },
                            styles: {
                                display: "inline-block",
                                verticalAlign: "middle",
                                height: "16px",
                                paddingRight: "0.5em",
                                paddingLeft: "0.2em"
                            }
                        },
                        {
                            tag: "div",
                            properties: {
                                innerHTML: `Speak Selection`
                            },
                            styles: {
                                display: "inline-block",
                                verticalAlign: "middle",
                            }
                        }
                    ],
                    listeners: [
                        {
                            type: "click",
                            listener: (e) => {addon.hooks.onSpeak(params.annotation.text.trim())}
                        }
                    ],
                    styles: {
                        height: "fit-content",
                        display: "flex",
                    }
                }
            )

            append(speakSelectionButton)
        },
        config.addonID
    )

    // TODO: reader - add "speak selection" and "speak comment"
    // Zotero.Reader.registerEventListener(
    //     "renderSidebarAnnotationHeader",
    //     (event) => {
    //         ztoolkit.log(event);
    //     }
    // )

    // TODO: reader - add toolbar UI elements and callbacks to update if currently playing
    // Zotero.Reader.registerEventListener(
    //     "renderToolbar",
    //     (event) => {
    //         ztoolkit.log(event);
    //     }
    // )
}