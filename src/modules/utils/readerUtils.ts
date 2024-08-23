import ReaderInstance = _ZoteroTypes.ReaderInstance;

export function getSelectedText(reader: ReaderInstance) {
    // @ts-ignore
    return reader._internalReader._primaryView._iframeWindow?.getSelection()?.getRangeAt(0).toString() || ""
}

export function getSelectedAnnotations(reader: ReaderInstance) {
    let annos = reader._internalReader._annotationManager._annotations
    return annos.filter((anno) => reader._internalReader._state.selectedAnnotationIDs.includes(anno.id))
}