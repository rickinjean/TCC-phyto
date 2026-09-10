import API_URL from "./config"

let refreshPromise = null

function clearSession() {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    window.dispatchEvent(new Event("auth:logout"))
}

async function refreshSession() {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) return null

    let res
    try {
        res = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { Authorization: `Bearer ${refreshToken}` },
        })
    } catch {
        return null
    }

    if (!res.ok) return null

    const data = await res.json()
    if (!data.token || !data.refreshToken) return null

    localStorage.setItem("token", data.token)
    localStorage.setItem("refreshToken", data.refreshToken)
    return data.token
}

// Coalesce chamadas concorrentes de renovação em uma única requisição.
function refreshOnce() {
    if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
            refreshPromise = null
        })
    }
    return refreshPromise
}

// Decodifica o payload (base64url) sem validação de assinatura — suficiente
// para inspecionar o `exp` localmente antes de decidir renovar.
function tokenPayload(token) {
    if (!token) return null
    try {
        const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
        return JSON.parse(decodeURIComponent(escape(atob(padded))))
    } catch {
        return null
    }
}

// Renova proativamente quando o access token expira em breve (<30s) ou já expirou,
// evitando o pico de 401/403 exatamente na virada do TTL.
function expiraEmbreve(token, margemMs = 30000) {
    const payload = tokenPayload(token)
    if (!payload || !payload.exp) return true
    return payload.exp * 1000 - Date.now() <= margemMs
}

export default async function authFetch(url, options = {}) {
    let token = localStorage.getItem("token")

    const doFetch = (tok) => {
        const headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${tok}`,
        }
        return fetch(url, { ...options, headers })
    }

    // Access token prestes a expirar: renova antes de chamar a API.
    if (token && expiraEmbreve(token)) {
        const novo = await refreshOnce()
        if (novo) token = novo
    } else if (!token && localStorage.getItem("refreshToken")) {
        // Sem access token, mas com refresh disponível: tenta renovar antes de desistir.
        token = await refreshOnce()
    }

    if (!token) {
        clearSession()
        return null
    }

    let res = await doFetch(token)

    // 401 = sessão expirada/inválida -> tenta renovar uma única vez e refaz a chamada.
    // 403 (acesso negado a rota ADM, e-mail não confirmado etc.) NÃO renova nem encerra
    // a sessão: o chamador lida com res.ok === false.
    if (res.status === 401) {
        const newToken = await refreshOnce()
        if (newToken) {
            res = await doFetch(newToken)
            // Mesmo após renovar a sessão persiste o 401: encerra de vez.
            if (res.status === 401) {
                clearSession()
                return null
            }
        } else {
            clearSession()
            return null
        }
    }

    return res
}
