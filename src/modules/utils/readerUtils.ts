import ReaderInstance = _ZoteroTypes.ReaderInstance;
import { notifyGeneric } from "./notify";
import { getString } from "./locale";

export function getSelectedText(reader: ReaderInstance) {
    return ztoolkit.Reader.getSelectedText(reader)
}

export async function getSelectedTextToEnd(reader: ReaderInstance) {
    const selected = getSelectedText(reader)

    if (selected === "") {
        // cannot "read from here" without a here to read from
        notifyGeneric(
          [getString("popup-SFH-noSelection")],
          "info"
        )

        return ""
    }

    const full = await getFullText(reader)

    const parts = full.split(selected)

    if (parts.length < 2) {
        // "read from here" failed to find the selected text
        notifyGeneric(
          [
              getString("popup-SFH-unknownSelection1"),
              getString("popup-SFH-unknownSelection2")
          ],
          "info"
        )

        return ""
    }
    if (parts.length > 2) {
        // cannot "read from here" without a more specific start point
        notifyGeneric(
          [
              getString("popup-SFH-nonspecificSelection1"),
              getString("popup-SFH-nonspecificSelection2")
          ],
          "info"
        )

        return ""
    }

    // recombine separator with "from here" and return
    return selected + parts[1]
}

export async function getFullText(reader: ReaderInstance) {
    return await Zotero.Items.get(reader.itemID ?? "").attachmentText
}

export function getSelectedAnnotations(reader: ReaderInstance) {
    let annos = reader._internalReader._annotationManager._annotations
    return annos.filter((anno) => reader._internalReader._state.selectedAnnotationIDs.includes(anno.id))
}