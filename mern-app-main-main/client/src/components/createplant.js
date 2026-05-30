import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'

// Mapeamento de coleções movido para fora do componente para evitar avisos do ESLint
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

export default function Create() {
    const [form, setForm] = useState({
        name: "", scientificName: "", description: "", simpleDescription: "",
        fruit: "", origin: "", type: "", propagation: "", toxicity: "", dificulty: "",
        Filo: "", Classe: "", Ordem: "", Family: "", Gênero: "", Especie: "",
        height: "", flowercolor: "", foliage: "", flowering: "",
        light: "", water: "", size: "", soil: "",
        watering: "", fertilizing: "", pruning: "", pests: "",
        manha: "", amount: "", frequency: "", NPK: "", season: "", tools: "", prevention: "", monitoring: "",
        planting: "", exhibition: "", maintenance: "",
        station: "", spacing: "", iluminosity: "", protection: "", idealTemperature: "", tolerance: "",
    })

    // Centraliza os dados dinâmicos vindos do MongoDB Atlas para cada select
    const [opcoesBanco, setOpcoesBanco] = useState({
        fruit: [], origin: [], type: [], propagation: [], toxicity: [], dificulty: [],
        height: [], flowercolor: [], foliage: [], flowering: [], light: [], water: [],
        size: [], soil: [], manha: [], amount: [], frequency: [], NPK: [], season: [],
        tools: [], prevention: [], monitoring: [], station: [], spacing: [],
        iluminosity: [], protection: [], idealTemperature: [], tolerance: []
    })

    // Controle de estado para abrir o Modal Dinâmico
    const [modalConfig, setModalConfig] = useState({ campoForm: "", colecaoMongo: "", labelAmigavel: "" })
    const [novoValorInput, setNovoValorInput] = useState("")

    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => ({ ...prev, ...value }))
    }

    // Carrega de forma otimizada os dados salvos em todas as coleções do Atlas
    useEffect(() => {
        async function carregarTodosDados() {
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
        
        carregarTodosDados()
    }, [])

    // Prepara as configurações do modal baseado em qual botão "+" foi clicado
    function abrirModalPara(campo) {
        setModalConfig({
            campoForm: campo,
            colecaoMongo: mapeamentoColecoes[campo].colecao,
            labelAmigavel: mapeamentoColecoes[campo].label
        })
        setNovoValorInput("")
    }

    // Envia um novo item customizado para o banco de dados
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

            // Atualiza a listagem interna do select específico
            setOpcoesBanco(prev => ({
                ...prev,
                [modalConfig.campoForm]: [...prev[modalConfig.campoForm], itemCriado]
            }))

            // Deixa o valor recém-criado selecionado no formulário principal
            updateForm({ [modalConfig.campoForm]: itemCriado.name })

            // Fecha o modal limpando os gatilhos do Bootstrap
            const botaoFechar = document.querySelector('#modalDinamico [data-bs-dismiss="modal"]')
            if (botaoFechar) botaoFechar.click()

        } catch (error) {
            console.error("Erro na requisição:", error)
            alert("Não foi possível conectar ao servidor para salvar.")
        }
    }

    // Remove uma categoria/valor customizado do banco de dados através do modal
    async function deletarItem(idItem) {
        if (!window.confirm("Tem certeza que deseja remover este item permanentemente do banco?")) return

        try {
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/collections/${modalConfig.colecaoMongo}/${idItem}`, {
                method: "DELETE"
            })

            if (response.ok) {
                // Filtra e remove o item da lista local do React em tempo real
                setOpcoesBanco(prev => ({
                    ...prev,
                    [modalConfig.campoForm]: prev[modalConfig.campoForm].filter(item => item._id !== idItem)
                }))

                // Se o item que foi removido estava atualmente selecionado, redefine o select para vazio
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

    // Cadastra o formulário final da planta inteira no banco de dados
    async function onSubmit(e) {
        e.preventDefault()
        const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        })

        if (!response.ok) {
            window.alert(`An error occurred: ${response.statusText}`)
            return
        }

        setForm({
            name: "", scientificName: "", description: "", simpleDescription: "",
            fruit: "", origin: "", type: "", propagation: "", toxicity: "", dificulty: "",
            Filo: "", Classe: "", Ordem: "", Family: "", Gênero: "", Especie: "",
            height: "", flowercolor: "", foliage: "", flowering: "",
            light: "", water: "", size: "", soil: "",
            watering: "", fertilizing: "", pruning: "", pests: "",
            manha: "", amount: "", frequency: "", NPK: "", season: "", tools: "", prevention: "", monitoring: "",
            planting: "", exhibition: "", maintenance: "",
            station: "", spacing: "", iluminosity: "", protection: "", idealTemperature: "", tolerance: "",
        })
        navigate("/plantlist")
    }

    // Componente reutilizável interno para montar a estrutura de Select + Botão "+"
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
                        <option key={item._id} value={item.name}>{item.name}</option>
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
            <h3 className="mb-4">Cadastrar Nova Planta</h3>

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

                    {/* Informações Botânicas */}
                    <div className="tab-pane fade" id="info-botanicas" role="tabpanel">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label>Fruto</label>
                                <RenderSelectComBotaoPlus campo="fruit" placeholder="Qual o tipo de fruto?" filhosPadrao={[
                                    <option key="f1" value="Carnosos">Carnosos</option>, <option key="f2" value="Secos">Secos</option>, <option key="f3" value="Verdadeiros">Verdadeiros</option>, <option key="f4" value="Pseudofrutos">Pseudofrutos</option>, <option key="f5" value="Infrutescências ">Infrutescências </option>, <option key="f6" value="Partenocárpicos">Partenocárpicos</option>
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Origem</label>
                                <RenderSelectComBotaoPlus campo="origin" placeholder="Qual a origem?" filhosPadrao={[
                                    <option key="o1" value="Nativas">Nativas</option>, <option key="o2" value="Endêmicas">Endêmicas</option>, <option key="o3" value="Exóticas">Exóticas</option>, <option key="o4" value="Naturalizadas">Naturalizadas</option>, <option key="o5" value="Invasoras">Invasoras</option>
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Tipo</label>
                                <RenderSelectComBotaoPlus campo="type" placeholder="Qual a função?" filhosPadrao={[
                                    <option key="t1" value="Ornamentais">Ornamentais</option>, <option key="t2" value="Frutíferas">Frutíferas </option>, <option key="t3" value="Hortícolas">Hortícolas </option>, <option key="t4" value="Aromáticas">Aromáticas</option>, <option key="t5" value="Medicinais-Fitoterápicas">Medicinais e Fitoterápicas</option>, <option key="t6" value="Carnivoras">Carnivoras</option>
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Propagação</label>
                                <RenderSelectComBotaoPlus campo="propagation" placeholder="Qual a propagação?" filhosPadrao={[
                                    <option key="p1" value="Sementes">Sementes</option>,
                                    <optgroup key="pg1" label="Assexuada ou Vegetativa">
                                        <option value="Estacas">Estacas</option> <option value="Mudas">Mudas</option> <option value="Enxertia">Enxertia</option> <option value="Alporquia">Alporquia</option> <option value="Divisão de touceiras">Divisão de touceiras</option>
                                    </optgroup>
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Toxicidade</label>
                                <RenderSelectComBotaoPlus campo="toxicity" placeholder="Qual a toxicidade?" filhosPadrao={[
                                    <option key="x1" value="Altamente Tóxicas">Altamente Tóxicas</option>, <option key="x2" value="Irritantes Gastres/Mucosas">Irritantes Gastres/Mucosas</option>, <option key="x3" value="Fototóxicas/Dermatites">Fototóxicas/Dermatites</option>, <option key="x4" value="Não Tóxicas">Não Tóxicas</option>
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Dificuldade</label>
                                <RenderSelectComBotaoPlus campo="dificulty" placeholder="Qual a dificuldade?" filhosPadrao={[
                                    <option key="d1" value="facil">Fácil</option>, <option key="d2" value="moderado">Moderado</option>, <option key="d3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                            <div className="col-md-4 mb-3"><label>Filo</label><input type="text" className="form-control" value={form.Filo} onChange={(e) => updateForm({ Filo: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Classe</label><input type="text" className="form-control" value={form.Classe} onChange={(e) => updateForm({ Classe: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Ordem</label><input type="text" className="form-control" value={form.Ordem} onChange={(e) => updateForm({ Ordem: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Família</label><input type="text" className="form-control" value={form.Family} onChange={(e) => updateForm({ Family: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Gênero</label><input type="text" className="form-control" value={form.Gênero} onChange={(e) => updateForm({ Gênero: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label>Espécie</label><input type="text" className="form-control" value={form.Especie} onChange={(e) => updateForm({ Especie: e.target.value })} /></div>
                        </div>
                    </div>

                    {/* Características Físicas */}
                    <div className="tab-pane fade" id="carac-fisicas" role="tabpanel">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Altura</label>
                                <RenderSelectComBotaoPlus campo="height" placeholder="Qual o tamanho?" filhosPadrao={[
                                    <option key="h1" value="Rasteira">Rasteira/Forração (Até 15 cm)</option>, <option key="h2" value="Pequena">Porte Pequeno (15 cm a 50 cm)</option>, <option key="h3" value="Moderada">Porte Médio (50 cm a 1,5 metro)</option>, <option key="h4" value="Alta">Porte Grande/Arbustiva (1,5 metro a 3 metros)</option>, <option key="h5" value="Árvore">Arbórea/Árvore (Acima de 3 metros)</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Cor da Flor</label>
                                <RenderSelectComBotaoPlus campo="flowercolor" placeholder="Qual a cor?" filhosPadrao={[
                                    <option key="c1" value="Não floresce">Não floresce/Sem flor ornamental</option>, <option key="c2" value="Branca">Branca</option>, <option key="c3" value="Vermelha">Vermelha/Cor de Rosa</option>, <option key="c4" value="Amarela">Amarela/Alaranjada</option>, <option key="c5" value="Azul">Azul/Roxa/Lilás</option>, <option key="c6" value="Multicolorida">Multicolorida/Matizada</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Folhagem</label>
                                <RenderSelectComBotaoPlus campo="foliage" placeholder="Qual a folhagem?" filhosPadrao={[
                                    <option key="fo1" value="Larga">Larga/Tropical</option>, <option key="fo2" value="Fina">Fina/Linear</option>, <option key="fo3" value="Suculenta">Suculenta/Carnuda</option>, <option key="fo4" value="Caduca">Caduca/Decídua</option>, <option key="fo5" value="Persistente">Persistente/Perene</option>, <option key="fo6" value="Variegada">Variegada/Matizada</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Floração</label>
                                <RenderSelectComBotaoPlus campo="flowering" placeholder="Qual a floração?" filhosPadrao={[
                                    <option key="fl1" value="Ano">Ano Inteiro</option>, <option key="fl2" value="Primavera">Primavera</option>, <option key="fl3" value="Verão">Verão</option>, <option key="fl4" value="Outono">Outono</option>, <option key="fl5" value="Inverno">Inverno</option>, <option key="fl6" value="Sem flor">Não se aplica</option>
                                ]} />
                            </div>
                        </div>
                    </div>

                    {/* Necessidades Ambientais */}
                    <div className="tab-pane fade" id="neces-ambientais" role="tabpanel">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Luminosidade</label>
                                <RenderSelectComBotaoPlus campo="light" placeholder="Qual a luminosidade?" filhosPadrao={[
                                    <option key="l1" value="sombra">Sombra</option>, <option key="l2" value="meia-sombra">Meia Sombra</option>, <option key="l3" value="sol-pleno">Sol Pleno</option>, <option key="l4" value="luz-difusa">Luz Difusa</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Água</label>
                                <RenderSelectComBotaoPlus campo="water" placeholder="Qual a necessidade de água?" filhosPadrao={[
                                    <option key="w1" value="baixa">Baixa</option>, <option key="w2" value="media">Média</option>, <option key="w3" value="alta">Alta</option>, <option key="w4" value="alagada">Alagada/Aquática</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Tamanho</label>
                                <RenderSelectComBotaoPlus campo="size" placeholder="Qual o tamanho?" filhosPadrao={[
                                    <option key="s1" value="pote">Pote/Mini Vaso (Até 12cm)</option>, <option key="s2" value="Vaso-Medio">Vaso Médio (13cm a 30cm)</option>, <option key="s3" value="Vaso-Grande">Vaso Grande (Acima de 30cm)</option>, <option key="s4" value="Solo">Canteiro/Solo Aberto</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Solo</label>
                                <RenderSelectComBotaoPlus campo="soil" placeholder="Qual o tipo de solo?" filhosPadrao={[
                                    <option key="sl1" value="Arenoso">Arenoso/Bem Drenado</option>, <option key="sl2" value="Orgânica">Rico em Matéria Orgânica</option>, <option key="sl3" value="Argiloso">Argiloso/Retentor de Umidade</option>, <option key="sl4" value="Fibroso">Substrato Inerte/Fibroso</option>
                                ]} />
                            </div>
                        </div>
                    </div>

                    {/* Cuidados da Planta */}
                    <div className="tab-pane fade" id="cuidados" role="tabpanel">
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <h5 className="border-bottom pb-2">Rega</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre a rega..." rows="3" value={form.watering} onChange={(e) => updateForm({ watering: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Melhor horário</label>
                                <RenderSelectComBotaoPlus campo="manha" placeholder="Qual o melhor horário?" filhosPadrao={[
                                    <option key="m1" value="Manha">Inicio da Manha</option>, <option key="m2" value="Tarde">Fim da Tarde</option>, <option key="m3" value="Qualquer">Qualquer horário</option>, <option key="m4" value="Noite">Período noturno</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Quantidade</label>
                                <RenderSelectComBotaoPlus campo="amount" placeholder="Qual a quantidade?" filhosPadrao={[
                                    <option key="am1" value="Abundante">Abundante (Até escorrer no fundo)</option>, <option key="am2" value="Moderada">Moderada (Apenas umedecer o solo)</option>, <option key="am3" value="Gotas">Esparsas/Gotas (Pouquíssima água)</option>, <option key="am4" value="Imersão">Por imersão</option>
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Fertilização</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre fertilização..." rows="3" value={form.fertilizing} onChange={(e) => updateForm({ fertilizing: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Frequência</label>
                                <RenderSelectComBotaoPlus campo="frequency" placeholder="Qual a frequência?" filhosPadrao={[
                                    <option key="fr1" value="Semanal">Semanal</option>, <option key="fr2" value="Quinzenal">Quinzenal (A cada 15 dias)</option>, <option key="fr3" value="Mensal">Mensal (A cada 30 dias)</option>, <option key="fr4" value="Bimestral">Bimestral</option>, <option key="fr5" value="Trimestral">Trimestral</option>, <option key="fr6" value="Estações">Apenas nas estações de crescimento</option>, <option key="fr7" value="Sem-fertilização">Não necessita de frequência</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>NPK recomendado</label>
                                <RenderSelectComBotaoPlus campo="NPK" placeholder="Qual o NPK?" filhosPadrao={[
                                    <option key="n1" value="Equilibrado">NPK 10-10-10</option>, <option key="n2" value="Fosforo">NPK 04-14-08</option>, <option key="n3" value="Nitrogenio">NPK 15-00-00</option>, <option key="n4" value="Potassio">NPK 09-04-13</option>, <option key="n5" value="Organico">Fertilizante Orgânico</option>
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Poda</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre a poda..." rows="3" value={form.pruning} onChange={(e) => updateForm({ pruning: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Época</label>
                                <RenderSelectComBotaoPlus campo="season" placeholder="Qual a época?" filhosPadrao={[
                                    <option key="se1" value="Inverno">Fim do inverno/Início da primavera</option>, <option key="se2" value="Floração">Após a floração</option>, <option key="se3" value="Ano-inteiro">Ano inteiro (Limpeza)</option>, <option key="se4" value="Outono">Outono</option>, <option key="se5" value="Sem-poda">Não necessita de poda</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Ferramentas</label>
                                <RenderSelectComBotaoPlus campo="tools" placeholder="Qual a ferramenta?" filhosPadrao={[
                                    <option key="tl1" value="Poda">Tesoura de poda manual</option>, <option key="tl2" value="Colheita">Tesoura de colheita</option>, <option key="tl3" value="Duas-Mãos">Tesoura de duas mãos</option>, <option key="tl4" value="serrote">Serrote de poda</option>, <option key="tl5" value="Desbaste">Apenas desbaste manual</option>
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Pragas e Doenças</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre pragas..." rows="3" value={form.pests} onChange={(e) => updateForm({ pests: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Prevenção</label>
                                <RenderSelectComBotaoPlus campo="prevention" placeholder="Qual o nível?" filhosPadrao={[
                                    <option key="pv1" value="facil">Fácil</option>, <option key="pv2" value="moderado">Moderado</option>, <option key="pv3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Monitoramento</label>
                                <RenderSelectComBotaoPlus campo="monitoring" placeholder="Qual o monitoramento?" filhosPadrao={[
                                    <option key="mn1" value="facil">Fácil</option>, <option key="mn2" value="moderado">Moderado</option>, <option key="mn3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                        </div>
                    </div>

                    {/* Cultivo da Planta */}
                    <div className="tab-pane fade" id="cultivo" role="tabpanel">
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <h5 className="border-bottom pb-2">Plantio</h5>
                                <textarea className="form-control" placeholder="Descrição detalhada sobre plantio..." rows="3" value={form.planting} onChange={(e) => updateForm({ planting: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Estação</label>
                                <RenderSelectComBotaoPlus campo="station" placeholder="Qual a estação?" filhosPadrao={[
                                    <option key="st1" value="facil">Fácil</option>, <option key="st2" value="moderado">Moderado</option>, <option key="st3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Espaçamento entre mudas</label>
                                <RenderSelectComBotaoPlus campo="spacing" placeholder="Qual o espaçamento?" filhosPadrao={[
                                    <option key="sp1" value="facil">Fácil</option>, <option key="sp2" value="moderado">Moderado</option>, <option key="sp3" value="dificil">Difícil</option>
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Exposição Solar e Condições</h5>
                                <textarea className="form-control" placeholder="Descreva a exposição solar..." rows="3" value={form.exhibition} onChange={(e) => updateForm({ exhibition: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Sol diário</label>
                                <RenderSelectComBotaoPlus campo="iluminosity" placeholder="Qual a exposição solar?" filhosPadrao={[
                                    <option key="il1" value="facil">Fácil</option>, <option key="il2" value="moderado">Moderado</option>, <option key="il3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Proteção</label>
                                <RenderSelectComBotaoPlus campo="protection" placeholder="Qual a proteção?" filhosPadrao={[
                                    <option key="pt1" value="facil">Fácil</option>, <option key="pt2" value="moderado">Moderado</option>, <option key="pt3" value="dificil">Difícil</option>
                                ]} />
                            </div>

                            <div className="col-md-12 mb-3 mt-3">
                                <h5 className="border-bottom pb-2">Manutenção</h5>
                                <textarea className="form-control" placeholder="Práticas recomendadas..." rows="3" value={form.maintenance} onChange={(e) => updateForm({ maintenance: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Temperatura ideal</label>
                                <RenderSelectComBotaoPlus campo="idealTemperature" placeholder="Qual a temperatura?" filhosPadrao={[
                                    <option key="it1" value="facil">Fácil</option>, <option key="it2" value="moderado">Moderado</option>, <option key="it3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Tolerância</label>
                                <RenderSelectComBotaoPlus campo="tolerance" placeholder="Qual a tolerância?" filhosPadrao={[
                                    <option key="tlr1" value="facil">Fácil</option>, <option key="tlr2" value="moderado">Moderado</option>, <option key="tlr3" value="dificil">Difícil</option>
                                ]} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-end">
                    <input type="submit" value="Cadastrar Planta" className="btn btn-primary btn-lg px-5" />
                </div>
            </form>

            {/* MODAL GERENCIÁVEL DINÂMICO (ADICIONAR E REMOVER) */}
            <div className="modal fade" id="modalDinamico" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Gerenciar: {modalConfig.labelAmigavel}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            {/* Seção para Inserir Novo Elemento */}
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
                                    <button className="btn btn-success" type="button" onClick={salvarNovoItem}>
                                        Salvar
                                    </button>
                                </div>
                            </div>

                            {/* Seção com Listagem e Botão Excluir */}
                            <div>
                                <label className="form-label font-weight-bold">Valores Cadastrados no Banco</label>
                                <ul className="list-group">
                                    {opcoesBanco[modalConfig.campoForm] && opcoesBanco[modalConfig.campoForm].length === 0 ? (
                                        <li className="list-group-item text-muted text-center small">Nenhum valor customizado criado ainda.</li>
                                    ) : (
                                        opcoesBanco[modalConfig.campoForm] && opcoesBanco[modalConfig.campoForm].map((item) => (
                                            <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                <span>{item.name}</span>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger border-0"
                                                    type="button"
                                                    title="Remover do Banco"
                                                    onClick={() => deletarItem(item._id)}
                                                >
                                                    &times;
                                                </button>
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