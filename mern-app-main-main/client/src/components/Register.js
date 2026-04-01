import { useState } from 'react';

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'; // IP do Servidor

export default function Register() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mensagem, setMensagem] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setMensagem('');

        console.log(`${REACT_APP_YOUR_HOSTNAME}/user/register`);
        try {
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/user/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                return setMensagem(data.message || 'Erro ao registrar');
            }

            setMensagem('Usuário registrado com sucesso!');
            setNome('');
            setEmail('');
            setSenha('');
        } catch (error) {
            setMensagem('Erro ao conectar com o servidor');
        }
    };

    return (
        <div className="container w-50">
            <form id="login-form" className="form" onSubmit={handleRegister}>
                <h3 className="text-center">Registro</h3>

                {mensagem && <p className="text-danger">{mensagem}</p>}

                <div className="form-group">
                    <label htmlFor="nome">Nome:</label>
                    <input
                        type="text"
                        name="nome"
                        id="nome"
                        className="form-control"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="senha">Senha:</label>
                    <input
                        type="password"
                        name="senha"
                        id="senha"
                        className="form-control"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group d-flex justify-content-between mt-4">
                    <input
                        type="submit"
                        name="submit"
                        className="btn btn-primary btn-md"
                        value="Registrar"
                    />
                    <a href="/login" className="btn btn-secondary btn-md ml-3">Voltar para login</a>
                </div>
            </form>
        </div>
    );

}