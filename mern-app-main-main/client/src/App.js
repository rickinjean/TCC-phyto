import { useState } from 'react';
import { Route, Routes, Navigate } from "react-router-dom"
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
import PlantDetails from './components/PlantDetails';
import Inicio from './components/inicio'
import Sobre from './components/Sobre'

function parseJwt(token) {
    if (!token) return null
    try {
        const payload = token.split('.')[1]
        const decoded = atob(payload)
        return JSON.parse(decoded)
    } catch {
        return null
    }
}

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(() => {
        const storedToken = localStorage.getItem('token')
        return parseJwt(storedToken)?.tipo || null
    });

    const handleLogin = (tokenValue) => {
        localStorage.setItem('token', tokenValue)
        setToken(tokenValue)
        setRole(parseJwt(tokenValue)?.tipo || null)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setRole(null)
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar token={token} role={role} onLogout={handleLogout} />
            <main className="app-main flex-fill">
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/register" element={<Register />} />
                    <Route exact path="/" element={token ? (role === "ADM" ? <UserList /> : <Navigate to="/plantlist" replace />) : <Navigate to="/login" replace />} />
                    <Route path="/plantlist" element={token ? <PlantList role={role} /> : <Navigate to="/login" replace />} />
                    <Route path="/userlist" element={token && role === "ADM" ? <UserList /> : <Navigate to={token ? "/" : "/login"} replace />} />
                    <Route path="/edit/:id" element={token && role === "ADM" ? <Edit /> : <Navigate to={token ? "/" : "/login"} replace />} />
                    <Route path="/editplant/:id" element={token && role === "ADM" ? <Editplant /> : <Navigate to={token ? "/plantlist" : "/login"} replace />} />
                    <Route path="/create" element={token && role === "ADM" ? <Create /> : <Navigate to={token ? "/" : "/login"} replace />} />
                    <Route path="/createplant" element={token && role === "ADM" ? <Createplant /> : <Navigate to={token ? "/plantlist" : "/login"} replace />} />
                    <Route path="/plantdetails/:id" element={token ? <PlantDetails /> : <Navigate to="/login" replace />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="/inicio" element={<Inicio />} />
                    <Route path="/Sobre" element={token ? <Sobre /> : <Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to={token ? (role === "ADM" ? "/" : "/plantlist") : "/login"} replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App