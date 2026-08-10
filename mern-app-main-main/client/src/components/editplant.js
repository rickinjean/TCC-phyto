import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'

const mapeamentoColecoes = {
    fruit: { colecao: "fruit", label: "Tipo de Fruto" },
    origin: { colecao: "origin", label: "Origem" },
    type: { colecao: "type", label: "Função/Tipo" },
    propagation: { colecao: "propagation", label: "Tipo de Propagação" },
    toxicity: { colecao: "toxicity", label: "Grau de Toxicidade" },
    dificulty: { colecao: "dificulty", label: "Dificuldade de Cuidado" },
    height: { colecao: "height", label: "Altura/Porte" },
    flowercolor: { colecao: "flowercolor", label: "Cor da Flor" },
    foliage: { colecao: "foliage", label: "Tipo de Folhagem" },
    flowering: { colecao: "flowering", label: "Época de Floração" },
    light: { colecao: "light", label: "Necessidade de Luz" },
    water: { colecao: "water", label: "Necessidade de Água" },
    size: { colecao: "size", label: "Tamanho do Vaso/Local" },
    soil: { colecao: "soil", label: "Tipo de Solo" },
    manha: { colecao: "manha", label: "Melhor Horário de Rega" },
    amount: { colecao: "amount", label: "Quantidade de Rega" },
    frequency: { colecao: "frequency", label: "Frequência de Adubação" },
    NPK: { colecao: "NPK", label: "Tipo de NPK" },
    season: { colecao: "season", label: "Época de Poda" },
    tools: { colecao: "tools", label: "Ferramenta de Poda" },
    prevention: { colecao: "prevention", label: "Nível de Prevenção" },
    monitoring: { colecao: "monitoring", label: "Nível de Monitoramento" },
    station: { colecao: "station", label: "Estação de Plantio" },
    spacing: { colecao: "spacing", label: "Espaçamento Mínimo" },
    iluminosity: { colecao: "iluminosity", label: "Horas de Sol Diário" },
    protection: { colecao: "protection", label: "Proteção Climática" },
    idealTemperature: { colecao: "idealTemperature", label: "Temperatura Ideal" },
    tolerance: { colecao: "tolerance", label: "Tolerância" }
}

export default function Edit() {
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
        imagesPath: [],
        imagePath: "" // Atributo para persistir o caminho retornado pelo MongoDB
    })

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

    const params = useParams()
    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => ({ ...prev, ...value }))
    }

    function handleImageChange(e) {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files)
            setImageFiles((prevFiles) => {
                const mergedFiles = [...prevFiles]
                selectedFiles.forEach((file) => {
                    const alreadyAdded = mergedFiles.some(
                        (existing) =>
                            existing.name === file.name &&
                            existing.size === file.size &&
                            existing.type === file.type
                    )
                    if (!alreadyAdded) {
                        mergedFiles.push(file)
                    }
                })
                return mergedFiles
            })
            e.target.value = null
        }
    }

    useEffect(() => {
        async function fetchData() {
            const id = params.id.toString()
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/${id}`)

            if (!response.ok) {
                const message = `An error has occurred: ${response.statusText}`
                window.alert(message)
                return
            }

            const record = await response.json()
            if (!record) {
                window.alert(`Record with id ${id} not found`)
                navigate("/plantlist")
                return
            }

            setForm(record)
        }

        async function carregarTodosDadosOptions() {
            const chaves = Object.keys(mapeamentoColecoes)
            const dadosCarregados = {}

            for (const chave of chaves) {
                try {
                    const nomeColecao = mapeamentoColecoes[chave].colecao
                    const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/collections/${nomeColecao}`)
                    if (response.ok) {
                        dadosCarregados[chave] = await response.json()
                    }
                } catch (err) {
                    console.error(`Erro ao buscar dados para o campo ${chave}:`, err)
                }
            }
            setOpcoesBanco(prev => ({ ...prev, ...dadosCarregados }))
        }

        fetchData()
        carregarTodosDadosOptions()
    }, [params.id, navigate])

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
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/collections/${modalConfig.colecaoMongo}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: novoValorInput })
            })

            if (!response.ok) {
                const erroServidor = await response.json()
                alert(`Erro do Servidor: ${erroServidor.message || response.statusText}`)
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
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/collections/${modalConfig.colecaoMongo}/${idItem}`, {
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

    // ALTERADO: Envia via FormData para persistir modificações de imagem no Back-end
    async function onSubmit(e) {
        e.preventDefault()

        const formData = new FormData()

        Object.keys(form).forEach((key) => {
            formData.append(key, form[key])
        })

        imageFiles.forEach((file) => {
            formData.append("images", file)
        })

        const token = localStorage.getItem('token')
        const headers = {}
        if (token) headers.Authorization = `Bearer ${token}`

        const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/${params.id}`, {
            method: "PUT",
            headers,
            body: formData
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            window.alert(`Erro ao atualizar: ${err.message || response.statusText}`)
            return
        }

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
        <div className="container mt-4">
            <h3 className="mb-4">Atualizar Planta</h3>

            <form onSubmit={onSubmit}>
                <ul className="nav nav-tabs mb-4" id="plantFormTabs" role="tablist">
                    <li className="nav-item" role="presentation"><button className="nav-link active" id="dados-basicos-tab" data-bs-toggle="tab" data-bs-target="#dados-basicos" type="button" role="tab">Dados Básicos</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="info-botanicas-tab" data-bs-toggle="tab" data-bs-target="#info-botanicas" type="button" role="tab">Informações Botânicas</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="carac-fisicas-tab" data-bs-toggle="tab" data-bs-target="#carac-fisicas" type="button" role="tab">Características Físicas</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="neces-ambientais-tab" data-bs-toggle="tab" data-bs-target="#neces-ambientais" type="button" role="tab">Necessidades Ambientais</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="cuidados-tab" data-bs-toggle="tab" data-bs-target="#cuidados" type="button" role="tab">Cuidados da Planta</button></li>
                    <li className="nav-item" role="presentation"><button className="nav-link" id="cultivo-tab" data-bs-toggle="tab" data-bs-target="#cultivo" type="button" role="tab">Cultivo da Planta</button></li>
                </ul>

                <div className="tab-content" id="plantFormTabsContent">
                    <div className="tab-pane fade show active" id="dados-basicos" role="tabpanel">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Nome</label>
                                <input type="text" className="form-control" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Nome Científico</label>
                                <input type="text" className="form-control" value={form.scientificName} onChange={(e) => updateForm({ scientificName: e.target.value })} />
                            </div>

                            {/* ALTERADO: Seção de visualização da foto anterior + seletor de arquivo */}
                            <div className="col-md-12 mb-3">
                                <label className="form-label font-weight-bold">Imagens da Planta</label>
                                {form.imagesPath?.length > 0 && (
                                    <div className="mb-2 d-flex flex-wrap gap-2">
                                        {form.imagesPath.map((path, index) => (
                                            <img 
                                                key={index}
                                                src={`${REACT_APP_YOUR_HOSTNAME}${path}`} 
                                                alt={`Foto ${index + 1}`} 
                                                style={{ width: "120px", height: "120px", borderRadius: "6px", objectFit: "cover", border: "1px solid #ddd" }} 
                                            />
                                        ))}
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    className="form-control" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleImageChange} 
                                />
                                <span className="form-text text-muted small">Selecione até 5 arquivos para adicionar ou substituir imagens.</span>
                                {imageFiles.length > 0 && (
                                    <div className="mt-1 text-success small fw-bold">
                                        {imageFiles.length} arquivo(s) selecionado(s): {imageFiles.map((file) => file.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-12 mb-3">
                                <label>Descrição Simples</label>
                                <textarea className="form-control" rows="3" value={form.simpleDescription} onChange={(e) => updateForm({ simpleDescription: e.target.value })} />
                            </div>
                            <div className="col-md-12 mb-3">
                                <label>Descrição</label>
                                <textarea className="form-control" rows="4" value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Restante do arquivo mantido exatamente igual ao seu original */}
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
                                <textarea className="form-control" rows="3" value={form.watering} onChange={(e) => updateForm({ watering: e.target.value })} />
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
                                <textarea className="form-control" rows="3" value={form.fertilizing} onChange={(e) => updateForm({ fertilizing: e.target.value })} />
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
                                <textarea className="form-control" rows="3" value={form.pruning} onChange={(e) => updateForm({ pruning: e.target.value })} />
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
                                <textarea className="form-control" rows="3" value={form.pests} onChange={(e) => updateForm({ pests: e.target.value })} />
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
                                <textarea className="form-control" rows="3" value={form.planting} onChange={(e) => updateForm({ planting: e.target.value })} />
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
                                <textarea className="form-control" rows="3" value={form.exhibition} onChange={(e) => updateForm({ exhibition: e.target.value })} />
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
                                <textarea className="form-control" rows="3" value={form.maintenance} onChange={(e) => updateForm({ maintenance: e.target.value })} />
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
                    <input type="submit" value="Atualizar Planta" className="btn btn-primary btn-lg px-5" />
                </div>
            </form>

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