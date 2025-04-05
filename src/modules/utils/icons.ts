import { config } from "../../../package.json"

export { loadIcons }

async function loadIcons() {
    // fetching the icons rather than hard coding it allows for better stylistic
    // changes without massively changing the code every time
    await fetch(`chrome://${config.addonRef}/content/icons/speak@16.svg`)
      .then((res) => res.text())
      .then((text) => {
          addon.data.ui.icons["speak"] = text
      })

    await fetch(`chrome://${config.addonRef}/content/icons/play@16.svg`)
      .then((res) => res.text())
      .then((text) => {
          addon.data.ui.icons["play"] = text
      })

    await fetch(`chrome://${config.addonRef}/content/icons/pause@16.svg`)
      .then((res) => res.text())
      .then((text) => {
          addon.data.ui.icons["pause"] = text
      })

    await fetch(`chrome://${config.addonRef}/content/icons/cancel@16.svg`)
      .then((res) => res.text())
      .then((text) => {
          addon.data.ui.icons["cancel"] = text
      })
}