import { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import UserList from "./components/userList"
import MessageList from "./components/MessageList"
import PlantList from "./components/PlantList"          
import Edit from "./components/edit"
import Editplant from './components/editplant';
import Createplant from "./components/createplant"
import Login from "./components/Login"
import Register from "./components/Register"
import Verify from "./components/Verify"
import PlantDetails from './components/PlantDetails';
import Inicio from './components/inicio'
import Sobre from './components/Sobre'
import ClientLists from './components/ClientLists'
import ClientListDetail from './components/ClientListDetail'
import Sugestao from './components/Sugestao'
import SugestaoModeracao from './components/SugestaoModeracao'
import ErrorBoundary from './ErrorBoundary'
import API_URL from "./config"

const urlParams = new URLSearchParams(window.location.search)
const oauthToken = urlParams.get('token')
const oauthRefreshToken = urlParams.get('refreshToken')
const oauthError = urlParams.get('error')
if (oauthToken) {
    localStorage.setItem('token', oauthToken)
    window.history.replaceState({}, '', window.location.pathname)
}
if (oauthRefreshToken) {
    localStorage.setItem('refreshToken', oauthRefreshToken)
}
if (oauthError) {
    window.history.replaceState({}, '', window.location.pathname)
}

function base64UrlDecode(str) {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i) & 0xff
    }
    return new TextDecoder().decode(bytes)
}

function parseJwt(token) {
    if (!token) return null
    try {
        const payload = token.split('.')[1]
        return JSON.parse(base64UrlDecode(payload))
    } catch {
        return null
    }
}

function isTokenExpired(token) {
    const payload = parseJwt(token)
    if (!payload || !payload.exp) return true
    return Date.now() >= payload.exp * 1000
}

const App = () => {
    const location = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('token')
        if (stored && isTokenExpired(stored)) {
            localStorage.removeItem('token')
            return null
        }
        return stored
    });
    const [role, setRole] = useState(() => {
        const storedToken = localStorage.getItem('token')
        const payload = parseJwt(storedToken)
        return payload?.tipo || null
    });
    const [userName, setUserName] = useState(() => {
        const storedToken = localStorage.getItem('token')
        return parseJwt(storedToken)?.name || null
    });
    const [userAvatar, setUserAvatar] = useState(() => {
        const storedToken = localStorage.getItem('token')
        return parseJwt(storedToken)?.avatar || null
    });
    const [hydrating, setHydrating] = useState(() => {
        const stored = localStorage.getItem('token')
        const storedRefresh = localStorage.getItem('refreshToken')
        if (stored && !isTokenExpired(stored)) return false
        return Boolean(storedRefresh)
    });

    useEffect(() => {
        let cancelled = false
        async function hydrate() {
            try {
                const storedToken = localStorage.getItem('token')
                const storedRefresh = localStorage.getItem('refreshToken')

                // Access token ainda válido: nada a fazer.
                if (storedToken && !isTokenExpired(storedToken)) return

                // Sem refresh token: a sessão realmente expirou.
                if (!storedRefresh) {
                    localStorage.removeItem('token')
                    return
                }

                // Renova a sessão silenciosamente antes de renderizar as rotas.
                let res
                try {
                    res = await fetch(`${API_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${storedRefresh}` },
                    })
                } catch {
                    return
                }

                if (!res.ok) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('refreshToken')
                    return
                }

                const data = await res.json()
                if (!data.token || !data.refreshToken) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('refreshToken')
                    return
                }

                if (!cancelled) {
                    localStorage.setItem('token', data.token)
                    localStorage.setItem('refreshToken', data.refreshToken)
                    setToken(data.token)
                    const payload = parseJwt(data.token)
                    setRole(payload?.tipo || null)
                    setUserName(payload?.name || null)
                    setUserAvatar(payload?.avatar || null)
                }
            } finally {
                if (!cancelled) setHydrating(false)
            }
        }
        hydrate()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        if (token && isTokenExpired(token)) {
            handleLogout()
        }
    }, [token])

    useEffect(() => {
        const handleAuthLogout = () => {
            handleLogout();
        };
        window.addEventListener("auth:logout", handleAuthLogout);
        return () => window.removeEventListener("auth:logout", handleAuthLogout);
    }, [])

    const handleLogin = (tokenValue, refreshTokenValue) => {
        localStorage.setItem('token', tokenValue)
        if (refreshTokenValue) localStorage.setItem('refreshToken', refreshTokenValue)
        setToken(tokenValue)
        const payload = parseJwt(tokenValue)
        setRole(payload?.tipo || null)
        setUserName(payload?.name || null)
        setUserAvatar(payload?.avatar || null)
    }

    const handleLogout = () => {
        const storedRefresh = localStorage.getItem('refreshToken')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        setToken(null)
        setRole(null)
        setUserName(null)
        setUserAvatar(null)

        // Revoga a sessão no servidor (best-effort; ignora falhas de rede).
        if (storedRefresh) {
            fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${storedRefresh}` },
            }).catch(() => {})
        }
    }

    if (hydrating) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-2" role="status" />
                    <div className="small text-muted">Restaurando sessão...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
            <Navbar token={token} role={role} userName={userName} userAvatar={userAvatar} onLogout={handleLogout} />
            <main className="app-main flex-fill" id="conteudo">
                <ErrorBoundary>
                    <Routes>
                        <Route path="/login" element={token ? <Navigate to="/inicio" replace /> : <Login onLogin={handleLogin} />} />
                        <Route path="/register" element={token ? <Navigate to="/inicio" replace /> : <Register />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route exact path="/" element={token ? (role === "ADM" ? <UserList /> : <Navigate to="/inicio" replace />) : <Inicio token={token} />} />
                        <Route path="/plantlist" element={<PlantList role={role} canFavorite={Boolean(token)} />} />
                        <Route path="/userlist" element={token && role === "ADM" ? <UserList /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="/messages" element={token && role === "ADM" ? <MessageList /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="/edit/:id" element={token && role === "ADM" ? <Edit /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="/editplant/:id" element={token && role === "ADM" ? <Editplant /> : <Navigate to={token ? "/plantlist" : "/login"} replace />} />
                        <Route path="/createplant" element={token && role === "ADM" ? <Createplant /> : <Navigate to={token ? "/plantlist" : "/login"} replace />} />

                        <Route path="/plantdetails/:id" element={<PlantDetails canFavorite={Boolean(token)} />} />
                        <Route path="/home" element={<Navigate to="/" replace />} />
                        <Route path="/inicio" element={<Inicio token={token} />} />
                        <Route path="/Sobre" element={<Sobre />} />
                        <Route path="/sobre" element={<Navigate to="/Sobre" replace />} />
                        <Route path="/favoritos" element={<Navigate to="/minhas-listas" replace />} />
                        <Route path="/minhas-listas" element={token ? <ClientLists /> : <Navigate to="/login" replace />} />
                        <Route path="/minhas-listas/:id" element={token ? <ClientListDetail /> : <Navigate to="/login" replace />} />
                        <Route path="/sugerir" element={token ? <Sugestao /> : <Navigate to="/login" replace />} />
                        <Route path="/moderar-sugestoes" element={token && role === "ADM" ? <SugestaoModeracao /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="*" element={<Navigate to={token ? (role === "ADM" ? "/" : "/inicio") : "/inicio"} replace />} />
                    </Routes>
                </ErrorBoundary>
            </main>
            <Footer />
        </div>
    )
}

export default App