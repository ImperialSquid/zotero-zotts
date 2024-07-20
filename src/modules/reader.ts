import { config } from "../../package.json"

export async function registerReaderListeners() {
    // fetching the icon rather than hard coding it allows for better stylistic
    // changes without massively changing the code
    let speakIcon: string
    await fetch(`chrome://${config.addonRef}/content/icons/speak@16.svg`)
        .then((res) => res.text())
        .then((text) => {speakIcon = text})

    let playIcon: string
    await fetch(`chrome://${config.addonRef}/content/icons/play@16.svg`)
        .then((res) => res.text())
        .then((text) => {playIcon = text})

    let pauseIcon: string
    await fetch(`chrome://${config.addonRef}/content/icons/pause@16.svg`)
        .then((res) => res.text())
        .then((text) => {pauseIcon = text})

    let cancelIcon: string
    await fetch(`chrome://${config.addonRef}/content/icons/cancel@16.svg`)
        .then((res) => res.text())
        .then((text) => {cancelIcon = text})

    Zotero.Reader.registerEventListener(
        "renderTextSelectionPopup",
        (event) => {
            const { reader, doc, params, append } = event
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
            const { reader, doc, params, append } = event
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
                (speakAnnotationButtons.children.item(1) as HTMLElement).style.display = "none"
            }

            append(speakAnnotationButtons)
        }
    )

    Zotero.Reader.registerEventListener(
        "renderToolbar",
        (event) => {
            const { reader, doc, params, append } = event
            let readerToolbarUI = ztoolkit.UI.createElement(doc, "div",
                {
                    children: [
                        {
                            tag: "button",
                            namespace: "html",
                            properties: {
                                innerHTML: `${playIcon}`,
                                // innerHTML: "PLAY"
                            },
                            classList: ["toolbar-button",],
                            listeners: [
                                {
                                    type: "click",
                                    listener: (e) => {
                                        // ztoolkit.log(`${reader.itemID}`)
                                        addon.hooks.onSpeakOrResume()
                                    }
                                }
                            ]
                        },
                        {
                            tag: "button",
                            namespace: "html",
                            properties: {
                                innerHTML: `${pauseIcon}`,
                                // innerHTML: "PAUSE"
                            },
                            classList: ["toolbar-button",],
                            listeners: [
                                {
                                    type: "click",
                                    listener: (e) => {
                                        // ztoolkit.log(`${reader.itemID}`)
                                        addon.hooks.onPause()
                                    }
                                }
                            ]
                        },
                        {
                            tag: "button",
                            namespace: "html",
                            properties: {
                                innerHTML: `${cancelIcon}`,
                                // innerHTML: "CANCEL"
                            },
                            classList: ["toolbar-button",],
                            listeners: [
                                {
                                    type: "click",
                                    listener: (e) => {
                                        // ztoolkit.log(`${reader.itemID}`)
                                        addon.hooks.onStop()
                                    }
                                }
                            ]
                        },
                    ]
                }
            )

            // TODO: future - need to add check for addon.tts.engines[add.tts.current].canPause
            //   WSA makes pausing easy to do, future TTS engines might not have the feature,
            //   this button should be hidden in that case

            append(readerToolbarUI)
            addon.data.ui.toolbars.push(readerToolbarUI)
        }
    )
}