import ReaderInstance = _ZoteroTypes.ReaderInstance;

export function getSelectedText(reader: ReaderInstance) {
    return ztoolkit.Reader.getSelectedText(reader)
}

export async function getFullText(reader: ReaderInstance) {
    return await Zotero.Items.get(reader.itemID ?? "").attachmentText
}

export function getSelectedAnnotations(reader: ReaderInstance) {
    let annos = reader._internalReader._annotationManager._annotations
    return annos.filter((anno) => reader._internalReader._state.selectedAnnotationIDs.includes(anno.id))
}