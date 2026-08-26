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

    if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token")
        window.dispatchEvent(new Event("auth:logout"))
        return null
    }

    return res
}
