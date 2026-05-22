// Registerplant.js

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = "http://localhost:5050"

export default function RegisterPlant() {
    const [form, setForm] = useState({
        // Dados Básicos
        name: "",
        scientificName: "",
        description: "",
        simpleDescription: "",
        // Informações Botânicas
        fruit: "",
        origin: "",
        type: "",
        propagation: "",
        toxicity: "",
        dificulty: "",
        // Classificação
        Filo: "",
        Classe: "",
        Ordem: "",
        Family: "",
        Gênero: "",
        Especie: "",
        // Características Físicas
        height: "",
        flowercolor: "",
        foliage: "",
        flowering: "",
        //Necessidades ambientais
        light: "",
        water: "",
        size: "",
        soil: "",
        // Cuidados
        watering: "",
        fertilizing: "",
        pruning: "",
        pests: "",
            //Dicas de Cuidados
            manha: "",
            amount: "",
            frequency: "",
            NPK: "",
            season: "",
            tools: "",
            prevention: "",
            monitoring: "",
        // Cultivo
        planting: "",
        exhibition: "",
        maintenance: "",
            // Dicas de Cultivo
            station: "",
            spacing: "",
            iluminosity: "",
            protection: "",
            idealTemperature: "",
            tolerance: "",
    })

    const [mensagem, setMensagem] = useState("")
    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function handleRegister(e) {
        e.preventDefault()
        setMensagem("")

        try {
            const response = await fetch(
                `${REACT_APP_YOUR_HOSTNAME}/plant/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setMensagem(data.message || "Erro ao cadastrar planta")
                return
            }

            setMensagem("Planta cadastrada com sucesso!")

            setTimeout(() => {
                navigate("/plantlist")
            }, 1000)

        } catch (error) {
            setMensagem("Erro ao conectar com o servidor")
        }
    }

    return (
        <div className="container mt-4">
            <h3 className="mb-4 text-center">Cadastrar Planta</h3>

            {mensagem && (
                <div className="alert alert-info">
                    {mensagem}
                </div>
            )}

            <form onSubmit={handleRegister}>
                <ul className="nav nav-tabs mb-4" id="plantFormTabs" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button className="nav-link active" id="dados-basicos-tab" data-bs-toggle="tab" data-bs-target="#dados-basicos" type="button" role="tab" aria-controls="dados-basicos" aria-selected="true">
                            Dados Básicos
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="info-botanicas-tab" data-bs-toggle="tab" data-bs-target="#info-botanicas" type="button" role="tab" aria-controls="info-botanicas" aria-selected="false">
                            Informações Botânicas
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="carac-fisicas-tab" data-bs-toggle="tab" data-bs-target="#carac-fisicas" type="button" role="tab" aria-controls="carac-fisicas" aria-selected="false">
                            Características Físicas
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="neces-ambientais-tab" data-bs-toggle="tab" data-bs-target="#neces-ambientais" type="button" role="tab" aria-controls="neces-ambientais" aria-selected="false">
                            Necessidades Ambientais
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="cuidados-tab" data-bs-toggle="tab" data-bs-target="#cuidados" type="button" role="tab" aria-controls="cuidados" aria-selected="false">
                            Cuidados da Planta
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="cultivo-tab" data-bs-toggle="tab" data-bs-target="#cultivo" type="button" role="tab" aria-controls="cultivo" aria-selected="false">
                            Cultivo da Planta
                        </button>
                    </li>
                </ul>

                <div className="tab-content" id="plantFormTabsContent">

                    {/* Dados Básicos */}
                    <div className="tab-pane fade show active" id="dados-basicos" role="tabpanel" aria-labelledby="dados-basicos-tab">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Nome</label>
                                <input
                                    type="text"
                                    placeholder="Digite o nome popular da planta. Exemplo: Rosa do Deserto."
                                    className="form-control"
                                    value={form.name}
                                    onChange={(e) => updateForm({ name: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Nome Científico</label>
                                <input
                                    type="text"
                                    placeholder="Digite o nome científico da planta. Exemplo: Adenium obesum."
                                    className="form-control"
                                    value={form.scientificName}
                                    onChange={(e) => updateForm({ scientificName: e.target.value })}
                                />
                            </div>
                            <div className="col-md-12 mb-3">
                                <label>Descrição Simples</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Forneça uma breve descrição da planta, destacando suas características mais marcantes."
                                    rows="4"
                                    value={form.simpleDescription}
                                    onChange={(e) => updateForm({ simpleDescription: e.target.value })}
                                />
                            </div>
                            <div className="col-md-12 mb-3">
                                <label>Descrição</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Forneça uma descrição detalhada da planta, incluindo informações sobre sua aparência, habitat natural e outras características relevantes."
                                    rows="4"
                                    value={form.description}
                                    onChange={(e) => updateForm({ description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informações Botânicas */}
                    <div className="tab-pane fade" id="info-botanicas" role="tabpanel" aria-labelledby="info-botanicas-tab">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label>Fruto</label>
                                <select
                                    className="form-control"
                                    value={form.fruit}
                                    onChange={(e) => updateForm({ fruit: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Origem</label>
                                <select
                                    className="form-control"
                                    value={form.origin}
                                    onChange={(e) => updateForm({ origin: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Tipo</label>
                                <select
                                    className="form-control"
                                    value={form.type}
                                    onChange={(e) => updateForm({ type: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Propagação</label>
                                <select
                                    className="form-control"
                                    value={form.propagation}
                                    onChange={(e) => updateForm({ propagation: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Toxicidade</label>
                                <select
                                    className="form-control"
                                    value={form.toxicity}
                                    onChange={(e) => updateForm({ toxicity: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Dificuldade</label>
                                <select
                                    className="form-control"
                                    value={form.dificulty}
                                    onChange={(e) => updateForm({ dificulty: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Filo</label>
                                <input
                                    type="text"
                                    placeholder="Descreva o Filo. Exemplo: Tracheophyta."
                                    className="form-control"
                                    value={form.Filo}
                                    onChange={(e) => updateForm({ Filo: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Classe</label>
                                <input
                                    type="text"
                                    placeholder="Descreva a Classe. Exemplo: Magnoliopsida."
                                    className="form-control"
                                    value={form.Classe}
                                    onChange={(e) => updateForm({ Classe: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Ordem</label>
                                <input
                                    type="text"
                                    placeholder="Descreva a Ordem. Exemplo: Gentianales."
                                    className="form-control"
                                    value={form.Ordem}
                                    onChange={(e) => updateForm({ Ordem: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Família</label>
                                <input
                                    type="text"
                                    placeholder="Descreva a Família. Exemplo: Apocynaceae."
                                    className="form-control"
                                    value={form.Family}
                                    onChange={(e) => updateForm({ Family: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Gênero</label>
                                <input
                                    type="text"
                                    placeholder="Descreva o Gênero. Exemplo: Adenium."
                                    className="form-control"
                                    value={form.Gênero}
                                    onChange={(e) => updateForm({ Gênero: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Espécie</label>
                                <input
                                    type="text"
                                    placeholder="Descreva a Espécie. Exemplo: Adenium obesum."
                                    className="form-control"
                                    value={form.Especie}
                                    onChange={(e) => updateForm({ Especie: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Características Físicas */}
                    <div className="tab-pane fade" id="carac-fisicas" role="tabpanel" aria-labelledby="carac-fisicas-tab">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Altura</label>
                                <select
                                    className="form-control"
                                    value={form.height}
                                    onChange={(e) => updateForm({ height: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Cor da Flor</label>
                                <select
                                    className="form-control"
                                    value={form.flowercolor}
                                    onChange={(e) => updateForm({ flowercolor: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Folhagem</label>
                                <select
                                    className="form-control"
                                    value={form.foliage}
                                    onChange={(e) => updateForm({ foliage: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Floração</label>
                                <select
                                    className="form-control"
                                    value={form.flowering}
                                    onChange={(e) => updateForm({ flowering: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Necessidades Ambientais */}
                    <div className="tab-pane fade" id="neces-ambientais" role="tabpanel" aria-labelledby="neces-ambientais-tab">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Luminosidade</label>
                                <select
                                    className="form-control"
                                    value={form.light}
                                    onChange={(e) => updateForm({ light: e.target.value })}
                                >
                                    <option value="">Escolha</option>
                                    <option value="sombra">Sombra</option>
                                    <option value="meia-sombra">Meia Sombra</option>
                                    <option value="sol-pleno">Sol Pleno</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Água</label>
                                <select
                                    className="form-control"
                                    value={form.water}
                                    onChange={(e) => updateForm({ water: e.target.value })}
                                >
                                    <option value="">Escolha</option>
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Tamanho</label>
                                <select
                                    className="form-control"
                                    value={form.size}
                                    onChange={(e) => updateForm({ size: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Solo</label>
                                <select
                                    className="form-control"
                                    value={form.soil}
                                    onChange={(e) => updateForm({ soil: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Cuidados da Planta */}
                    <div className="tab-pane fade" id="cuidados" role="tabpanel" aria-labelledby="cuidados-tab">
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <h5 className="border-bottom pb-2">Rega</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Faça uma descrição detalhada sobre a rega da planta..."
                                    rows="3"
                                    value={form.watering}
                                    onChange={(e) => updateForm({ watering: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Melhor horário</label>
                                <select
                                    className="form-control"
                                    value={form.manha}
                                    onChange={(e) => updateForm({ manha: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Quantidade</label>
                                <select
                                    className="form-control"
                                    value={form.amount}
                                    onChange={(e) => updateForm({ amount: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Fertilização</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Faça uma descrição detalhada sobre a fertilização da planta..."
                                    rows="3"
                                    value={form.fertilizing}
                                    onChange={(e) => updateForm({ fertilizing: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Frequência</label>
                                <select
                                    className="form-control"
                                    value={form.frequency}
                                    onChange={(e) => updateForm({ frequency: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>NPK recomendado</label>
                                <select
                                    className="form-control"
                                    value={form.NPK}
                                    onChange={(e) => updateForm({ NPK: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Poda</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Faça uma descrição detalhada sobre a poda da planta..."
                                    rows="3"
                                    value={form.pruning}
                                    onChange={(e) => updateForm({ pruning: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Época</label>
                                <select
                                    className="form-control"
                                    value={form.season}
                                    onChange={(e) => updateForm({ season: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Ferramentas</label>
                                <select
                                    className="form-control"
                                    value={form.tools}
                                    onChange={(e) => updateForm({ tools: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Pragas e Doenças</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Faça uma descrição detalhada sobre as pragas e doenças..."
                                    rows="3"
                                    value={form.pests}
                                    onChange={(e) => updateForm({ pests: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Prevenção</label>
                                <select
                                    className="form-control"
                                    value={form.prevention}
                                    onChange={(e) => updateForm({ prevention: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Monitoramento</label>
                                <select
                                    className="form-control"
                                    value={form.monitoring}
                                    onChange={(e) => updateForm({ monitoring: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Cultivo da Planta */}
                    <div className="tab-pane fade" id="cultivo" role="tabpanel" aria-labelledby="cultivo-tab">
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <h5 className="border-bottom pb-2">Plantio</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Faça uma descrição detalhada sobre o plantio da planta..."
                                    rows="3"
                                    value={form.planting}
                                    onChange={(e) => updateForm({ planting: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Estação</label>
                                <select
                                    className="form-control"
                                    value={form.station}
                                    onChange={(e) => updateForm({ station: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Espaçamento entre mudas</label>
                                <select
                                    className="form-control"
                                    value={form.spacing}
                                    onChange={(e) => updateForm({ spacing: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Exposição Solar e Condições</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Descreva a exposição solar ideal para o cultivo..."
                                    rows="3"
                                    value={form.exhibition}
                                    onChange={(e) => updateForm({ exhibition: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Sol diário</label>
                                <select
                                    className="form-control"
                                    value={form.iluminosity}
                                    onChange={(e) => updateForm({ iluminosity: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Proteção</label>
                                <select
                                    className="form-control"
                                    value={form.protection}
                                    onChange={(e) => updateForm({ protection: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Manutenção</h5>
                                <textarea
                                    className="form-control"
                                    placeholder="Práticas recomendadas para garantir um cultivo saudável..."
                                    rows="3"
                                    value={form.maintenance}
                                    onChange={(e) => updateForm({ maintenance: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Temperatura ideal</label>
                                <select
                                    className="form-control"
                                    value={form.idealTemperature}
                                    onChange={(e) => updateForm({ idealTemperature: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Tolerância</label>
                                <select
                                    className="form-control"
                                    value={form.tolerance}
                                    onChange={(e) => updateForm({ tolerance: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="facil">Fácil</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="dificil">Difícil</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-4 text-end">
                    <input
                        type="submit"
                        value="Cadastrar Planta"
                        className="btn btn-primary btn-lg px-5"
                    />
                </div>
            </form>
        </div>
    )
}