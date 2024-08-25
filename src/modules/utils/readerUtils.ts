import ReaderInstance = _ZoteroTypes.ReaderInstance;

export function getSelectedText(reader: ReaderInstance) {
    return ztoolkit.Reader.getSelectedText(reader)
}

export function getSelectedAnnotations(reader: ReaderInstance) {
    let annos = reader._internalReader._annotationManager._annotations
    return annos.filter((anno) => reader._internalReader._state.selectedAnnotationIDs.includes(anno.id))
}