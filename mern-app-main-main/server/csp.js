function parseConnectSources(raw) {
    return String(raw || "").split(",").map(value => value.trim()).filter(value => {
        if (!value) return false
        try {
            const url = new URL(value)
            return ["http:", "https:"].includes(url.protocol) && url.origin === value
        } catch {
            return false
        }
    })
}

module.exports = { parseConnectSources }
