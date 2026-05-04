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

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-fill container my-4">
                <Routes>
                    <Route path="/login" element={<Login onLogin={(token) => { localStorage.setItem('token', token); setToken(token); }} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/registerplant" element={<Register />} />
                    <Route exact path="/" element={token ? <UserList /> : <Navigate to="/login" replace />} />
                    <Route path="/plantlist" element={token ? <PlantList /> : <Navigate to="/login" replace />} />
                    <Route path="/edit/:id" element={token ? <Edit /> : <Navigate to="/login" replace />} />
                    <Route path="/editplant/:id" element={token ?<Editplant /> : <Navigate to="/login" replace />} />
                    <Route path="/create" element={token ? <Create /> : <Navigate to="/login" replace />} />
                    <Route path="/createplant" element={token ? <Createplant /> : <Navigate to="/login" replace />} />
                    <Route path="/plantdetails/:id" element={token ? <PlantDetails /> : <Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App