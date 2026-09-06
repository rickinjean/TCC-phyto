import { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import UserList from "./components/userList"
import PlantList from "./components/PlantList"          
import Edit from "./components/edit"
import Editplant from './components/editplant';
import Create from "./components/create"
import Createplant from "./components/createplant"
import Login from "./components/Login"
import Register from "./components/Register"
import Verify from "./components/Verify"
import PlantDetails from './components/PlantDetails';
import Inicio from './components/inicio'
import Sobre from './components/Sobre'
import Favorites from './components/Favorites'
import ErrorBoundary from './ErrorBoundary'

const urlParams = new URLSearchParams(window.location.search)
const oauthToken = urlParams.get('token')
const oauthError = urlParams.get('error')
if (oauthToken) {
    localStorage.setItem('token', oauthToken)
    window.history.replaceState({}, '', window.location.pathname)
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
    const [favTick, setFavTick] = useState(0);

    const notifyFavChange = () => setFavTick(t => t + 1);

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

    const handleLogin = (tokenValue) => {
        localStorage.setItem('token', tokenValue)
        setToken(tokenValue)
        const payload = parseJwt(tokenValue)
        setRole(payload?.tipo || null)
        setUserName(payload?.name || null)
        setUserAvatar(payload?.avatar || null)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setRole(null)
        setUserName(null)
        setUserAvatar(null)
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
                        <Route path="/plantlist" element={<PlantList role={role} canFavorite={Boolean(token)} favTick={favTick} />} />
                        <Route path="/userlist" element={token && role === "ADM" ? <UserList /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="/edit/:id" element={token && role === "ADM" ? <Edit /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="/editplant/:id" element={token && role === "ADM" ? <Editplant /> : <Navigate to={token ? "/plantlist" : "/login"} replace />} />
                        <Route path="/create" element={token && role === "ADM" ? <Create /> : <Navigate to={token ? "/" : "/login"} replace />} />
                        <Route path="/createplant" element={token && role === "ADM" ? <Createplant /> : <Navigate to={token ? "/plantlist" : "/login"} replace />} />

                        <Route path="/plantdetails/:id" element={<PlantDetails onFavChange={notifyFavChange} canFavorite={Boolean(token)} />} />
                        <Route path="/home" element={<Navigate to="/" replace />} />
                        <Route path="/inicio" element={<Inicio token={token} />} />
                        <Route path="/Sobre" element={<Sobre />} />
                        <Route path="/sobre" element={<Navigate to="/Sobre" replace />} />
                        <Route path="/favoritos" element={token ? <Favorites key={favTick} /> : <Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to={token ? (role === "ADM" ? "/" : "/inicio") : "/inicio"} replace />} />
                    </Routes>
                </ErrorBoundary>
            </main>
            <Footer />
        </div>
    )
}

export default App