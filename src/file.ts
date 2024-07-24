function _read<T>(blob: Blob, method: "readAsDataURL" | "readAsText" | "readAsArrayBuffer", encoding?: string) {
    return new Promise<T>((resolve, reject) => {
        const reader = new FileReader();
        reader[method](blob, encoding);
        reader.onload = () => {
            resolve(reader.result as T);
        }
        reader.onerror = () => {
            reject(reader.error)
        }
    })
}

export function readAsText(blob: Blob, encoding?: string) {
    return _read<string>(blob, "readAsText", encoding)
}

export function readAsDataURL(blob: Blob, encoding?: string) {
    return _read<string>(blob, "readAsDataURL", encoding)
}

export function readAsArrayBuffer(blob: Blob, encoding?: string) {
    return _read<ArrayBuffer>(blob, "readAsArrayBuffer", encoding)
}