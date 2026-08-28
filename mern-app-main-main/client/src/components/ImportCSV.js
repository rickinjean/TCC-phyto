import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"

export default function ImportCSV() {
    const [file, setFile] = useState(null)
    const [csvContent, setCsvContent] = useState("")
    const [fileBase64, setFileBase64] = useState("")
    const [fileName, setFileName] = useState("")
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [step, setStep] = useState("upload")
    const fileRef = useRef()
    const navigate = useNavigate()

    function handleFileChange(e) {
        const selected = e.target.files[0]
        if (!selected) return
        const isCsv = selected.name.endsWith(".csv")
        const isXlsx = selected.name.endsWith(".xlsx") || selected.name.endsWith(".xls")
        if (!isCsv && !isXlsx) {
            alert("Selecione um arquivo .csv ou .xlsx")
            return
        }
        setFile(selected)
        setFileName(selected.name)
        setResult(null)

        if (isXlsx) {
            // Ler XLSX como base64
            const reader = new FileReader()
            reader.onload = (ev) => {
                const base64 = ev.target.result.split(",")[1]
                setFileBase64(base64)
                setCsvContent("")
                setPreview({ totalLines: "?", note: "Planilha XLSX — será processada no servidor" })
            }
            reader.readAsDataURL(selected)
        } else {
            // Ler CSV como texto
            const reader = new FileReader()
            reader.onload = (ev) => {
                const content = ev.target.result
                setCsvContent(content)
                setFileBase64("")
                const lines = content.split("\n").filter(l => l.trim())
                setPreview({ totalLines: lines.length - 1, headers: lines[0] })
            }
            reader.readAsText(selected, "UTF-8")
        }
    }

    async function handleImport() {
        if (!csvContent && !fileBase64) return
        setLoading(true)
        try {
            const body = csvContent ? { csvContent } : { fileBase64, fileName }
            const res = await authFetch(`${API_URL}/plant/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            if (!res || !res.ok) {
                const err = res ? await res.json().catch(() => ({})) : {}
                alert(err.message || "Erro ao importar.")
                setLoading(false)
                return
            }
            const data = await res.json()
            setResult(data)
            setStep("result")
        } catch {
            alert("Erro ao conectar ao servidor.")
        }
        setLoading(false)
    }

    async function downloadTemplate() {
        try {
            const res = await authFetch(`${API_URL}/plant/import/template`)
            if (!res || !res.ok) {
                alert("Erro ao baixar template.")
                return
            }
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "template_plantas.xlsx"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch {
            alert("Erro ao conectar ao servidor.")
        }
    }

    return (
        <div className="admin-page container mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="admin-page__title mb-1">Importar Plantas via Planilha</h3>
                    <p className="text-muted mb-0">Cadastre múltiplas plantas de uma vez usando uma planilha.</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/plantlist")}>
                    ← Voltar
                </button>
            </div>

            {/* ── PASSO 1: BAIXAR TEMPLATE ── */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                        <div className="import-step-number">1</div>
                        <div className="flex-grow-1">
                            <h5 className="mb-1">Baixar modelo da planilha</h5>
                            <p className="text-muted mb-0 small">
                                O modelo é um arquivo Excel (.xlsx) com layout vertical colorido. Abra no Google Sheets.
                            </p>
                        </div>
                        <button className="btn btn-outline-success" onClick={downloadTemplate}>
                            📥 Baixar planilha
                        </button>
                    </div>
                </div>
            </div>

            {/* ── PASSO 2: ENVIAR ARQUIVO ── */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                        <div className="import-step-number">2</div>
                        <div className="flex-grow-1">
                            <h5 className="mb-1">Enviar planilha preenchida</h5>
                            <p className="text-muted mb-0 small">
                                Envie o arquivo .xlsx preenchido — ou exporte como CSV no Google Sheets.
                            </p>
                        </div>
                        <div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="d-none"
                                onChange={handleFileChange}
                            />
                            <button className="btn btn-outline-primary" onClick={() => fileRef.current?.click()}>
                                📄 Selecionar arquivo
                            </button>
                        </div>
                    </div>
                    {file && (
                        <div className="mt-3 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{file.name}</strong>
                                    <span className="text-muted ms-2">({preview?.totalLines} planta(s) encontrada(s))</span>
                                </div>
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={handleImport}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Importando...
                                        </>
                                    ) : (
                                        `🚀 Importar ${preview?.totalLines || 0} planta(s)`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PASSO 3: RESULTADO ── */}
            {step === "result" && result && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="import-step-number">3</div>
                            <h5 className="mb-0">Resultado da importação</h5>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <div className="card text-center border-0 bg-light">
                                    <div className="card-body">
                                        <div className="display-6 fw-bold text-primary">{result.total}</div>
                                        <small className="text-muted">Total de linhas</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card text-center border-0 bg-light">
                                    <div className="card-body">
                                        <div className="display-6 fw-bold text-success">{result.success}</div>
                                        <small className="text-muted">Cadastradas com sucesso</small>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card text-center border-0 bg-light">
                                    <div className="card-body">
                                        <div className="display-6 fw-bold text-danger">{result.errors.length}</div>
                                        <small className="text-muted">Erros</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {result.plants.length > 0 && (
                            <div className="mb-3">
                                <h6 className="text-success">✅ Cadastradas:</h6>
                                <ul className="list-group list-group-flush">
                                    {result.plants.map(p => (
                                        <li key={p._id} className="list-group-item bg-transparent px-0">
                                            {p.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.errors.length > 0 && (
                            <div className="mb-3">
                                <h6 className="text-danger">❌ Erros:</h6>
                                <ul className="list-group list-group-flush">
                                    {result.errors.map((e, i) => (
                                        <li key={i} className="list-group-item bg-transparent px-0 text-danger">
                                            Linha {e.row}: {e.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-primary" onClick={() => navigate("/plantlist")}>
                                Ver plantas cadastradas
                            </button>
                            <button className="btn btn-outline-secondary" onClick={() => {
                                setStep("upload")
                                setFile(null)
                                setCsvContent("")
                                setPreview(null)
                                setResult(null)
                                if (fileRef.current) fileRef.current.value = ""
                            }}>
                                Importar mais
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DICAS ── */}
            <div className="card border-0 bg-light">
                <div className="card-body">
                    <h6 className="card-title">💡 Como funciona</h6>
                    <ul className="mb-0 small text-muted">
                        <li>Baixe a planilha Excel (.xlsx) e abra no Google Sheets</li>
                        <li>Na aba <strong>"Dados"</strong>, preencha a coluna <strong>"Valor"</strong> ao lado de cada campo</li>
                        <li>Cada planta ocupa um bloco de linhas separado por um separador</li>
                        <li>Para adicionar mais plantas, copie um bloco de campos</li>
                        <li>Envie o arquivo <strong>.xlsx</strong> preenchido — ou exporte como CSV</li>
                        <li><strong>Nome Popular</strong> e <strong>Nome Científico</strong> são os únicos campos obrigatórios</li>
                        <li>Campos de seleção aceitam o texto — se não existir, será criado automaticamente</li>
                        <li>URLs de imagem são opcionais — deixe vazio se não tiver foto</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
