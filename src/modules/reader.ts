import {config} from "../../package.json";

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

    Zotero.Reader.registerEventListener(
        "renderSidebarAnnotationHeader",
        (event) => {
            const { reader, doc, params, append } = event;
            const speakAnnotationButtons = ztoolkit.UI.createElement(doc, "div",
                {
                    children: [
                        {
                            // annotation button
                            tag: "div",
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
                                        innerHTML: `Anno.`
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
                                    listener: (e) => {
                                        addon.hooks.onSpeak(params.annotation.text)
                                    }
                                }
                            ],
                            styles: {
                                height: "fit-content",
                                display: "flex",
                            }
                        },
                        {
                            // comment button
                            tag: "div",
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
                                        innerHTML: `Comm.`
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
                                    listener: (e) => {
                                        addon.hooks.onSpeak(params.annotation.comment as string)
                                    }
                                }
                            ],
                            styles: {
                                height: "fit-content",
                                display: "flex",
                            }
                        },
                    ],
                    styles: {
                        display: "flex",
                        flexDirection: "column",
                        paddingRight: "5px",
                        width: "70px"  // forced width here prevents elements shifting around when comm. is hidden
                    }
                }
            )

            // if no comment, hide button to speak it
            if (! params.annotation.comment) {
                (speakAnnotationButtons.children.item(1) as HTMLElement).style.display = "none";
            }

            append(speakAnnotationButtons)
        }
    )

    // TODO: reader - add toolbar UI elements and callbacks to update if currently playing
    // Zotero.Reader.registerEventListener(
    //     "renderToolbar",
    //     (event) => {
    //         ztoolkit.log(event);
    //     }
    // )
}