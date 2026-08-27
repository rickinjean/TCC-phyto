const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
const PADDING = "~"

/* eslint-disable no-undef */
function encodeId(id) {
    if (!id) return id
    const hex = String(id)
    let num = BigInt("0x" + hex)
    let result = ""
    const base = BigInt(ALPHABET.length)
    while (num > 0n) {
        result = ALPHABET[Number(num % base)] + result
        num = num / base
    }
    return (result || "0") + PADDING
}

function decodeId(encoded) {
    if (!encoded) return encoded
    let str = String(encoded)
    if (str.endsWith(PADDING)) str = str.slice(0, -1)
    let num = 0n
    const base = BigInt(ALPHABET.length)
    for (const ch of str) {
        const idx = ALPHABET.indexOf(ch)
        if (idx === -1) return encoded
        num = num * base + BigInt(idx)
    }
    return num.toString(16).padStart(24, "0")
}
/* eslint-enable no-undef */

export { encodeId, decodeId }
