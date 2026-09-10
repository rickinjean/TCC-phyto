import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_URL from "../config";

export default function Verify() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [status, setStatus] = useState("carregando");
    const [mensagem, setMensagem] = useState("");

    const [email, setEmail] = useState("");
    const [resendStatus, setResendStatus] = useState(null);
    const [resendMsg, setResendMsg] = useState("");
    const [resendLoading, setResendLoading] = useState(false);

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

    async function handleResend(e) {
        e.preventDefault();
        if (!email.trim()) return;
        setResendLoading(true);
        setResendStatus(null);
        setResendMsg("");
        try {
            const res = await fetch(`${API_URL}/user/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            setResendStatus("ok");
            setResendMsg(data.mensagem || "E-mail reenviado com sucesso!");
        } catch {
            setResendStatus("erro");
            setResendMsg("Erro ao conectar com o servidor.");
        } finally {
            setResendLoading(false);
        }
    }

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

                        <hr className="my-3" />
                        <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>
                            Não recebeu o e-mail? Insira seu e-mail para reenviar a confirmação:
                        </p>
                        <form onSubmit={handleResend}>
                            <div className="input-group mb-2">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button
                                    className="btn btn-outline-primary"
                                    type="submit"
                                    disabled={resendLoading}
                                >
                                    {resendLoading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" />
                                    ) : (
                                        "Reenviar"
                                    )}
                                </button>
                            </div>
                        </form>
                        {resendStatus && (
                            <div className={`alert alert-${resendStatus === "ok" ? "success" : "danger"} py-2 mt-2`} role="alert">
                                {resendMsg}
                            </div>
                        )}

                        <button className="btn btn-outline-secondary w-100 py-2 mt-3" onClick={() => navigate("/register")}>
                            Voltar ao cadastro
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
