import { config } from "../../package.json"
import { getString } from "./utils/locale";
import { getSelectedText } from "./utils/readerUtils";

export async function registerReaderListeners() {
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
                                innerHTML: `${ addon.data.ui.icons.speak }`
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
                                innerHTML: getString("textPopup-selection")
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
                            listener: (e) => {addon.hooks.onSpeak(getSelectedText(reader))}
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
                                        innerHTML: `${ addon.data.ui.icons.speak }`
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
                                        innerHTML: getString("anno-annotation")
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
                                        innerHTML: `${ addon.data.ui.icons.speak }`
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
                                        innerHTML: getString("anno-comment")
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
                                innerHTML: `${ addon.data.ui.icons.play }`,
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
                                innerHTML: `${ addon.data.ui.icons.pause }`,
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
                                innerHTML: `${ addon.data.ui.icons.cancel }`,
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
                    ],
                    styles: {
                        display: "flex",
                    }
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