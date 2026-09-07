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

export default async function authFetch(url, options = {}) {
    let token = localStorage.getItem("token")

    const doFetch = (tok) => {
        const headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${tok}`,
        }
        return fetch(url, { ...options, headers })
    }

    // Sem access token, mas com refresh disponível: tenta renovar antes de desistir.
    if (!token && localStorage.getItem("refreshToken")) {
        token = await refreshOnce()
    }

    if (!token) {
        clearSession()
        return null
    }

    let res = await doFetch(token)

    // 401 = sessão expirada/inválida -> tenta renovar uma única vez e refaz a chamada.
    // 403 (ex.: acesso negado a rota ADM) NÃO encerra a sessão: o chamador lida com res.ok === false.
    if (res.status === 401) {
        const newToken = await refreshOnce()
        if (newToken) {
            res = await doFetch(newToken)
        } else {
            clearSession()
            return null
        }
    }

    return res
}
