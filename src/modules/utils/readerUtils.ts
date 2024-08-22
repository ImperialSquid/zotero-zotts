import ReaderInstance = _ZoteroTypes.ReaderInstance;

export function getSelectedText(reader: ReaderInstance) {
    return ztoolkit.Reader.getSelectedText(reader)
}