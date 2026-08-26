import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import mapeamentoColecoes from "../mapeamentoColecoes"

export default function Create() {
    const [form, setForm] = useState({
        name: "", scientificName: "", description: "", simpleDescription: "",
        fruit: "", origin: "", type: "", propagation: "", toxicity: "", dificulty: "",
        Filo: "", Classe: "", Ordem: "", Family: "", Genero: "", Especie: "",
        height: "", flowercolor: "", foliage: "", flowering: "",
        light: "", water: "", size: "", soil: "",
        watering: "", fertilizing: "", pruning: "", pests: "",
        manha: "", amount: "", frequency: "", NPK: "", season: "", tools: "", prevention: "", monitoring: "",
        planting: "", exhibition: "", maintenance: "",
        station: "", spacing: "", iluminosity: "", protection: "", idealTemperature: "", tolerance: "",
    })

    // NOVO ESTADO: Guarda os arquivos de imagem selecionados pelo usuário
    const [imageFiles, setImageFiles] = useState([])

    const [opcoesBanco, setOpcoesBanco] = useState({
        fruit: [], origin: [], type: [], propagation: [], toxicity: [], dificulty: [],
        height: [], flowercolor: [], foliage: [], flowering: [], light: [], water: [],
        size: [], soil: [], manha: [], amount: [], frequency: [], NPK: [], season: [],
        tools: [], prevention: [], monitoring: [], station: [], spacing: [],
        iluminosity: [], protection: [], idealTemperature: [], tolerance: []
    })

    const [modalConfig, setModalConfig] = useState({ campoForm: "", colecaoMongo: "", labelAmigavel: "" })
    const [novoValorInput, setNovoValorInput] = useState("")

    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => ({ ...prev, ...value }))
    }

    // CAPTURA OS ARQUIVOS DE IMAGEM
    function handleImageChange(e) {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files)
            setImageFiles((prevFiles) => {
                const mergedFiles = [...prevFiles]
                for (const file of selectedFiles) {
                    const alreadyAdded = mergedFiles.some(
                        (existing) =>
                            existing.name === file.name &&
                            existing.size === file.size &&
                            existing.type === file.type
                    )
                    if (!alreadyAdded) {
                        mergedFiles.push(file)
                    }
                    if (mergedFiles.length >= 5) break
                }
                return mergedFiles.slice(0, 5)
            })
            // Reset para permitir re-seleção do mesmo arquivo se necessário
            e.target.value = null
        }
    }

    useEffect(() => {
        async function carregarTodosDados() {
            const chaves = Object.keys(mapeamentoColecoes)
            const dadosCarregados = {}

            for (const chave of chaves) {
                try {
                    const nomeColecao = mapeamentoColecoes[chave].colecao
                    const res = await authFetch(`${API_URL}/collections/${nomeColecao}`)
                    if (res && res.ok) {
                        dadosCarregados[chave] = await res.json()
                    }
                } catch (err) {
                    console.error(`Erro ao buscar dados para o campo ${chave}:`, err)
                }
            }
            setOpcoesBanco(prev => ({ ...prev, ...dadosCarregados }))
        }
        carregarTodosDados()
    }, [])

    function abrirModalPara(campo) {
        setModalConfig({
            campoForm: campo,
            colecaoMongo: mapeamentoColecoes[campo].colecao,
            labelAmigavel: mapeamentoColecoes[campo].label
        })
        setNovoValorInput("")
    }

    async function salvarNovoItem() {
        if (!novoValorInput.trim()) {
            alert("Preencha um valor válido.")
            return
        }

        try {
            const response = await authFetch(`${API_URL}/collections/${modalConfig.colecaoMongo}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: novoValorInput })
            })

            if (!response || !response.ok) {
                const erroServidor = response ? await response.json().catch(() => ({})) : {}
                alert(`Erro do Servidor: ${erroServidor.message || response?.statusText || "Sem resposta"}`)
                return
            }

            const itemCriado = await response.json()

            setOpcoesBanco(prev => ({
                ...prev,
                [modalConfig.campoForm]: [...prev[modalConfig.campoForm], itemCriado]
            }))

            updateForm({ [modalConfig.campoForm]: itemCriado._id })

            const botaoFechar = document.querySelector('#modalDinamico [data-bs-dismiss="modal"]')
            if (botaoFechar) botaoFechar.click()

        } catch (error) {
            console.error("Erro na requisição:", error)
            alert("Não foi possível conectar ao servidor para salvar.")
        }
    }

    async function deletarItem(idItem) {
        if (!window.confirm("Tem certeza que deseja remover este item permanentemente do banco?")) return

        try {
            const response = await authFetch(`${API_URL}/collections/${modalConfig.colecaoMongo}/${idItem}`, {
                method: "DELETE"
            })

            if (response.ok) {
                setOpcoesBanco(prev => ({
                    ...prev,
                    [modalConfig.campoForm]: prev[modalConfig.campoForm].filter(item => item._id !== idItem)
                }))

                if (form[modalConfig.campoForm] === idItem || opcoesBanco[modalConfig.campoForm].find(i => i._id === idItem)?.name === form[modalConfig.campoForm]) {
                    updateForm({ [modalConfig.campoForm]: "" })
                }
            } else {
                const erro = await response.json()
                alert(`Erro ao deletar: ${erro.message}`)
            }
        } catch (error) {
            console.error("Erro ao deletar item:", error)
            alert("Não foi possível conectar ao servidor para deletar.")
        }
    }

    // ALTERADO: Envio dos dados adaptado para FormData (Multipart/Form-Data)
    async function onSubmit(e) {
        e.preventDefault()

        const formData = new FormData()

        // 1. Vincula todos os textos estruturados do seu form original
        Object.keys(form).forEach((key) => {
            formData.append(key, form[key])
        })

        // 2. Vincula os arquivos binários de imagem com o nome de chave 'images'
        imageFiles.forEach((file) => {
            formData.append("images", file)
        })

        const token = localStorage.getItem('token')
        const headers = {}
        if (token) headers.Authorization = `Bearer ${token}`

        const response = await fetch(`${API_URL}/plant/add`, {
            method: "POST",
            headers,
            // ATENÇÃO: Deixe o navegador definir os headers do FormData automaticamente!
            body: formData
        })

        if (!response.ok) {
            window.alert(`An error occurred: ${response.statusText}`)
            return
        }

        setForm({
            name: "", scientificName: "", description: "", simpleDescription: "",
            fruit: "", origin: "", type: "", propagation: "", toxicity: "", dificulty: "",
            Filo: "", Classe: "", Ordem: "", Family: "", Genero: "", Especie: "",
            height: "", flowercolor: "", foliage: "", flowering: "",
            light: "", water: "", size: "", soil: "",
            watering: "", fertilizing: "", pruning: "", pests: "",
            manha: "", amount: "", frequency: "", NPK: "", season: "", tools: "", prevention: "", monitoring: "",
            planting: "", exhibition: "", maintenance: "",
            station: "", spacing: "", iluminosity: "", protection: "", idealTemperature: "", tolerance: "",
        })
        setImageFiles([])
        
        navigate("/plantlist")
    }

    const RenderSelectComBotaoPlus = ({ campo, placeholder, filhosPadrao = [] }) => {
        return (
            <div className="input-group">
                <select
                    className="form-control"
                    value={form[campo]}
                    onChange={(e) => updateForm({ [campo]: e.target.value })}
                >
                    <option value="">{placeholder}</option>
                    {filhosPadrao}
                    {opcoesBanco[campo] && opcoesBanco[campo].map((item) => (
                        <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                </select>
                <button
                    className="btn btn-outline-primary"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#modalDinamico"
                    onClick={() => abrirModalPara(campo)}
                >
                    +
                </button>
            </div>
        )
    }

    return (
        <div className="admin-page admin-page--plant-form container mt-4">
            <h3 className="admin-page__title mb-4">Cadastrar Nova Planta</h3>

            <form className="plant-admin-form" onSubmit={onSubmit}>
                <ul className="nav nav-tabs mb-4" id="plantFormTabs" role="tablist">
                    <li className="nav-item" role="presentation"><button className="nav-link active" id="dados-basicos-tab" data-bs-toggle="tab" data-bs-target="#dados-basicos" type="button" role="tab">Dados Básicos</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="info-botanicas-tab" data-bs-toggle="tab" data-bs-target="#info-botanicas" type="button" role="tab">Informações Botânicas</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="carac-fisicas-tab" data-bs-toggle="tab" data-bs-target="#carac-fisicas" type="button" role="tab">Características Físicas</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="neces-ambientais-tab" data-bs-toggle="tab" data-bs-target="#neces-ambientais" type="button" role="tab">Necessidades Ambientais</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="cuidados-tab" data-bs-toggle="tab" data-bs-target="#cuidados" type="button" role="tab">Cuidados da Planta</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="cultivo-tab" data-bs-toggle="tab" data-bs-target="#cultivo" type="button" role="tab">Cultivo da Planta</button></li>
                </ul>

                <div className="tab-content" id="plantFormTabsContent">
                    {/* Dados Básicos */}
                    <div className="tab-pane fade show active" id="dados-basicos" role="tabpanel">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Nome</label>
                                <input type="text" placeholder="Digite o nome popular da planta." className="form-control" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Nome Científico</label>
                                <input type="text" placeholder="Digite o nome científico." className="form-control" value={form.scientificName} onChange={(e) => updateForm({ scientificName: e.target.value })} />
                            </div>

                            {/* NOVO CAMPO: Input do tipo arquivo para a imagem */}
                            <div className="col-md-12 mb-3">
                                <label className="form-label font-weight-bold">Imagem da Planta</label>
                                <input 
                                    type="file" 
                                    name="images"
                                    className="form-control" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleImageChange} 
                                />
                                {imageFiles.length > 0 && (
                                    <div className="mt-1 text-muted small">
                                        {imageFiles.length} arquivo(s) selecionado(s): {imageFiles.map((file) => file.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-12 mb-3">
                                <label>Descrição Simples</label>
                                <textarea className="form-control" placeholder="Breve descrição..." rows="3" value={form.simpleDescription} onChange={(e) => updateForm({ simpleDescription: e.target.value })} />
                            </div>
                            <div className="col-md-12 mb-3">
                                <label>Descrição</label>
                                <textarea className="form-control" placeholder="Descrição detalhada..." rows="4" value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Os demais blocos de abas (Botânicas, Físicas, etc.) permanecem idênticos ao seu arquivo original */}
                    <div className="tab-pane fade" id="info-botanicas" role="tabpanel">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label>Fruto</label>
                                <RenderSelectComBotaoPlus campo="fruit" placeholder="Qual o tipo de fruto?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Origem</label>
                                <RenderSelectComBotaoPlus campo="origin" placeholder="Qual a origem?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Tipo</label>
                                <RenderSelectComBotaoPlus campo="type" placeholder="Qual a função?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Propagação</label>
                                <RenderSelectComBotaoPlus campo="propagation" placeholder="Qual a propagação?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Toxicidade</label>
                                <RenderSelectComBotaoPlus campo="toxicity" placeholder="Qual a toxicidade?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Dificuldade</label>
                                <RenderSelectComBotaoPlus campo="dificulty" placeholder="Qual a dificuldade?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3"><label>Filo</label><input type="text" className="form-control" value={form.Filo} onChange={(e) => updateForm({ Filo: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Classe</label><input type="text" className="form-control" value={form.Classe} onChange={(e) => updateForm({ Classe: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Ordem</label><input type="text" className="form-control" value={form.Ordem} onChange={(e) => updateForm({ Ordem: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Família</label><input type="text" className="form-control" value={form.Family} onChange={(e) => updateForm({ Family: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Gênero</label><input type="text" className="form-control" value={form.Genero} onChange={(e) => updateForm({ Genero: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Espécie</label><input type="text" className="form-control" value={form.Especie} onChange={(e) => updateForm({ Especie: e.target.value })} /></div>
                        </div>
                    </div>

                    <div className="tab-pane fade" id="carac-fisicas" role="tabpanel">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Altura</label>
                                <RenderSelectComBotaoPlus campo="height" placeholder="Qual o tamanho?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Cor da Flor</label>
                                <RenderSelectComBotaoPlus campo="flowercolor" placeholder="Qual a cor?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Folhagem</label>
                                <RenderSelectComBotaoPlus campo="foliage" placeholder="Qual a folhagem?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Floração</label>
                                <RenderSelectComBotaoPlus campo="flowering" placeholder="Qual a floração?" filhosPadrao={[
                                ]} />
                            </div>
                        </div>
                    </div>

                    <div className="tab-pane fade" id="neces-ambientais" role="tabpanel">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Luminosidade</label>
                                <RenderSelectComBotaoPlus campo="light" placeholder="Qual a luminosidade?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Água</label>
                                <RenderSelectComBotaoPlus campo="water" placeholder="Qual a necessidade de água?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Tamanho</label>
                                <RenderSelectComBotaoPlus campo="size" placeholder="Qual o tamanho?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Solo</label>
                                <RenderSelectComBotaoPlus campo="soil" placeholder="Qual o tipo de solo?" filhosPadrao={[
                                ]} />
                            </div>
                        </div>
                    </div>

                    <div className="tab-pane fade" id="cuidados" role="tabpanel">
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <h5 className="border-bottom pb-2">Rega</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre a rega..." rows="3" value={form.watering} onChange={(e) => updateForm({ watering: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Melhor horário</label>
                                <RenderSelectComBotaoPlus campo="manha" placeholder="Qual o melhor horário?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Quantidade</label>
                                <RenderSelectComBotaoPlus campo="amount" placeholder="Qual a quantidade?" filhosPadrao={[
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Fertilização</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre fertilização..." rows="3" value={form.fertilizing} onChange={(e) => updateForm({ fertilizing: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Frequência</label>
                                <RenderSelectComBotaoPlus campo="frequency" placeholder="Qual a frequência?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>NPK recomendado</label>
                                <RenderSelectComBotaoPlus campo="NPK" placeholder="Qual o NPK?" filhosPadrao={[
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Poda</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre a poda..." rows="3" value={form.pruning} onChange={(e) => updateForm({ pruning: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Época</label>
                                <RenderSelectComBotaoPlus campo="season" placeholder="Qual a época?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Ferramentas</label>
                                <RenderSelectComBotaoPlus campo="tools" placeholder="Qual a ferramenta?" filhosPadrao={[
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Pragas e Doenças</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre pragas..." rows="3" value={form.pests} onChange={(e) => updateForm({ pests: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Prevenção</label>
                                <RenderSelectComBotaoPlus campo="prevention" placeholder="Qual o nível?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Monitoramento</label>
                                <RenderSelectComBotaoPlus campo="monitoring" placeholder="Qual o monitoramento?" filhosPadrao={[
                                ]} />
                            </div>
                        </div>
                    </div>

                    <div className="tab-pane fade" id="cultivo" role="tabpanel">
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <h5 className="border-bottom pb-2">Plantio</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre plantio..." rows="3" value={form.planting} onChange={(e) => updateForm({ planting: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Estação</label>
                                <RenderSelectComBotaoPlus campo="station" placeholder="Qual a estação?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Espaçamento entre mudas</label>
                                <RenderSelectComBotaoPlus campo="spacing" placeholder="Qual o espaçamento?" filhosPadrao={[
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Exposição Solar e Condições</h5>
                                <textarea className="form-control" placeholder="Descreva a exposição solar..." rows="3" value={form.exhibition} onChange={(e) => updateForm({ exhibition: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Sol diário</label>
                                <RenderSelectComBotaoPlus campo="iluminosity" placeholder="Qual a exposição solar?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Proteção</label>
                                <RenderSelectComBotaoPlus campo="protection" placeholder="Qual a proteção?" filhosPadrao={[
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Manutenção</h5>
                                <textarea className="form-control" placeholder="Práticas recomendadas..." rows="3" value={form.maintenance} onChange={(e) => updateForm({ maintenance: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Temperatura ideal</label>
                                <RenderSelectComBotaoPlus campo="idealTemperature" placeholder="Qual a temperatura?" filhosPadrao={[
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Tolerância</label>
                                <RenderSelectComBotaoPlus campo="tolerance" placeholder="Qual a tolerância?" filhosPadrao={[
                                ]} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-end">
                    <input type="submit" value="Cadastrar Planta" className="btn btn-primary btn-lg px-5" />
                </div>
            </form>

            {/* MODAL GERENCIÁVEL DINÂMICO */}
            <div className="modal fade" id="modalDinamico" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Gerenciar: {modalConfig.labelAmigavel}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-4 pb-3 border-bottom">
                                <label className="form-label font-weight-bold">Adicionar Novo Valor</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ex: Novo valor..."
                                        value={novoValorInput}
                                        onChange={(e) => setNovoValorInput(e.target.value)}
                                    />
                                    <button className="btn btn-success" type="button" onClick={salvarNovoItem}>Salvar</button>
                                </div>
                            </div>

                            <div>
                                <label className="form-label font-weight-bold">Valores Cadastrados no Banco</label>
                                <ul className="list-group">
                                    {opcoesBanco[modalConfig.campoForm] && opcoesBanco[modalConfig.campoForm].length === 0 ? (
                                        <li className="list-group-item text-muted text-center small">Nenhum valor customizado criado ainda.</li>
                                    ) : (
                                        opcoesBanco[modalConfig.campoForm] && opcoesBanco[modalConfig.campoForm].map((item) => (
                                            <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                <span>{item.name}</span>
                                                <button className="btn btn-sm btn-outline-danger border-0" type="button" onClick={() => deletarItem(item._id)}>&times;</button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}