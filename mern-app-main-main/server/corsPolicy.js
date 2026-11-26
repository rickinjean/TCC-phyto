function normalizeOrigin(origin) {
    if (!origin) return ""
    return String(origin).trim().replace(/\/+$/, "").toLowerCase()
}

function isAllowedOrigin(origin, allowlist) {
    if (!origin) return true
    const normalized = normalizeOrigin(origin)
    return allowlist.some(value => normalizeOrigin(value) === normalized)
}

function isSameOriginRequest(req, origin) {
    if (!origin || !req || !req.protocol) return false
    const host = typeof req.get === "function" ? req.get("host") : req.headers && req.headers.host
    if (!host) return false
    return normalizeOrigin(`${req.protocol}://${host}`) === normalizeOrigin(origin)
}

module.exports = { normalizeOrigin, isAllowedOrigin, isSameOriginRequest }
