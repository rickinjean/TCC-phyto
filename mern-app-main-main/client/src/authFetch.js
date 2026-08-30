export default async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token")
    if (!token) {
        localStorage.removeItem("token")
        window.dispatchEvent(new Event("auth:logout"))
        return null
    }

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    }

    const res = await fetch(url, { ...options, headers })

    // 401 = sessão expirada/inválida -> logout. 403 (ex.: acesso negado a rota
    // ADM) NÃO encerra a sessão: o chamador lida com res.ok === false.
    if (res.status === 401) {
        localStorage.removeItem("token")
        window.dispatchEvent(new Event("auth:logout"))
        return null
    }

    return res
}
