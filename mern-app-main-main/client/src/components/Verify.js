import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_URL from "../config";

export default function Verify() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [status, setStatus] = useState("carregando");
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        const confirmar = async () => {
            if (!token) {
                setStatus("erro");
                setMensagem("Token de verificação ausente.");
                return;
            }
            try {
                const response = await fetch(`${API_URL}/user/verify?token=${token}`);
                const data = await response.json();
                if (!response.ok) {
                    setStatus("erro");
                    setMensagem(data.mensagem || "Falha ao confirmar o e-mail.");
                    return;
                }
                setStatus("sucesso");
                setMensagem(data.mensagem || "E-mail confirmado!");
            } catch (error) {
                setStatus("erro");
                setMensagem("Erro ao conectar com o servidor.");
            }
        };
        confirmar();
    }, [token]);

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
            <div className="w-100 text-center" style={{ maxWidth: 400 }}>
                <h2 className="fw-normal mb-3">Confirmação de e-mail</h2>
                {status === "carregando" && (
                    <div className="d-flex justify-content-center py-4">
                        <span className="spinner-border text-primary" role="status" />
                    </div>
                )}
                {status === "sucesso" && (
                    <>
                        <div className="alert alert-success py-2" role="alert">{mensagem}</div>
                        <button className="btn btn-primary w-100 py-2" onClick={() => navigate("/login")}>
                            Ir para o login
                        </button>
                    </>
                )}
                {status === "erro" && (
                    <>
                        <div className="alert alert-danger py-2" role="alert">{mensagem}</div>
                        <button className="btn btn-outline-secondary w-100 py-2" onClick={() => navigate("/register")}>
                            Voltar ao cadastro
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}