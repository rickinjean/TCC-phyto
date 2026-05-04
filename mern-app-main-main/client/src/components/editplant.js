import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'

export default function Edit() {
    const [form, setForm] = useState({
        
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
            luminosity: "",
            protection: "",
            idealTemperature: "",
            tolerance: "",
    })

    const params = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() {
            const response = await fetch(
                `${REACT_APP_YOUR_HOSTNAME}/plant/${params.id}`
            )

            if (!response.ok) {
                const message = `An error occurred: ${response.statusText}`
                window.alert(message)
                return
            }

            const plant = await response.json()

            if (!plant) {
                window.alert(`Planta com id ${params.id} não encontrada`)
                navigate("/plantlist")
                return
            }

            setForm(plant)
        }

        fetchData()

        return
    }, [params.id, navigate])

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function onSubmit(e) {
        e.preventDefault()

        const editedplant = { ...form }

        const response = await fetch(
            `${REACT_APP_YOUR_HOSTNAME}/plant/${params.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(editedplant)
            }
        )

        if (!response.ok) {
            const message = `An error occurred: ${response.statusText}`
            window.alert(message)
            return
        }

        navigate("/plantlist")
    }

    return (
<div className="container mt-4">
            <h3 className="mb-4">Editar Planta</h3>

            <form onSubmit={onSubmit}>
                <h4 className="mb-4">Dados Básicos</h4>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label>Nome</label>
                        <input
                            type="text"
                            placeholder="Digite o nome popular da planta. Exemplo: Rosa do Deserto."
                            className="form-control"
                            value={form.name}
                            onChange={(e) =>
                                updateForm({ name: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Nome Científico</label>
                        <input
                            type="text"
                            placeholder="Digite o nome científico da planta. Exemplo: Adenium obesum."
                            className="form-control"
                            value={form.scientificName}
                            onChange={(e) =>
                                updateForm({
                                    scientificName: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <label>Descrição Simples</label>
                        <textarea
                            className="form-control"
                            placeholder="Forneça uma breve descrição da planta, destacando suas características mais marcantes."
                            rows="4"
                            value={form.simpleDescription}
                            onChange={(e) =>
                                updateForm({
                                    simpleDescription: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <label>Descrição</label>
                        <textarea
                            className="form-control"
                            placeholder="Forneça uma descrição detalhada da planta, incluindo informações sobre sua aparência, habitat natural e outras características relevantes."
                            rows="4"
                            value={form.description}
                            onChange={(e) =>
                                updateForm({
                                    description: e.target.value
                                })
                            }
                        />
                    </div>

                    <h4 className="mb-4">Informações Botânicas</h4>
                    <div className="col-md-4 mb-3">
                        <label>Fruto</label>
                        <input
                            type="text"
                            placeholder="Descreva qual o fruto da planta."
                            className="form-control"
                            value={form.fruit}
                            onChange={(e) =>
                                updateForm({ fruit: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Origem</label>
                        <input
                            type="text"
                            placeholder="Descreva a origem da planta."
                            className="form-control"
                            value={form.origin}
                            onChange={(e) =>
                                updateForm({
                                    origin: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Tipo</label>
                        <input
                            type="text"
                            placeholder="Descreva o tipo da planta. Exemplo: Arbusto, árvore, herbácea, etc."
                            className="form-control"
                            value={form.type}
                            onChange={(e) =>
                                updateForm({ type: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>propagação</label>
                        <input
                            type="text"
                            placeholder="Descreva a propagação da planta."
                            className="form-control"
                            value={form.propagation}
                            onChange={(e) =>
                                updateForm({
                                    propagation: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Toxicidade</label>
                        <input
                            type="text"
                            placeholder="Descreva a toxicidade da planta, se aplicável."
                            className="form-control"
                            value={form.toxicity}
                            onChange={(e) =>
                                updateForm({ toxicity: e.target.value })
                            }
                        />
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

                    <h4 className="mb-4">Informações Botânicas</h4>
                    <div className="col-md-4 mb-3">
                        <label>Filo</label>
                        <input
                            type="text"
                            placeholder="Descreva o Filo. Exemplo: Tracheophyta."
                            className="form-control"
                            value={form.Filo}
                            onChange={(e) =>
                                updateForm({ Filo: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Classe</label>
                        <input
                            type="text"
                            placeholder="Descreva a Classe. Exemplo: Magnoliopsida."
                            className="form-control"
                            value={form.Classe}
                            onChange={(e) =>
                                updateForm({
                                    Classe: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Ordem</label>
                        <input
                            type="text"
                            placeholder="Descreva a Ordem. Exemplo: Gentianales."
                            className="form-control"
                            value={form.Ordem}
                            onChange={(e) =>
                                updateForm({ Ordem: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Família</label>
                        <input
                            type="text"
                            placeholder="Descreva a Família. Exemplo: Apocynaceae."
                            className="form-control"
                            value={form.Family}
                            onChange={(e) =>
                                updateForm({
                                    Family: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Gênero</label>
                        <input
                            type="text"
                            placeholder="Descreva o Gênero. Exemplo: Adenium."
                            className="form-control"
                            value={form.Gênero}
                            onChange={(e) =>
                                updateForm({ Gênero: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label>Espécie</label>
                        <input
                            type="text"
                            placeholder="Descreva a Espécie. Exemplo: Adenium obesum."
                            className="form-control"
                            value={form.Especie}
                            onChange={(e) =>
                                updateForm({ Especie: e.target.value })
                            }
                        />
                    </div>

                    <h4 className="mt-4 mb-3">Características Físicas</h4>
                    <div className="col-md-6 mb-3">
                        <label>Altura</label>
                        <input
                            type="text"
                            placeholder="Descreva a altura média da planta. Exemplo: 1-2 metros."
                            className="form-control"
                            value={form.height}
                            onChange={(e) =>
                                updateForm({ height: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Cor da Flor</label>
                        <input
                            type="text"
                            placeholder="Descreva a cor da flor. Exemplo: Vermelho."
                            className="form-control"
                            value={form.flowercolor}
                            onChange={(e) =>
                                updateForm({ flowercolor: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Folhagem</label>
                        <input
                            type="text"
                            placeholder="Descreva a folhagem. Exemplo: Suculenta, verde brilhante, coriácea."
                            className="form-control"
                            value={form.foliage}
                            onChange={(e) =>
                                updateForm({ foliage: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Floração</label>
                        <input
                            type="text"
                            placeholder="Descreva o periodo de floração. Exemplo: Primavera, Verão."
                            className="form-control"
                            value={form.flowering}
                            onChange={(e) =>
                                updateForm({ flowering: e.target.value })
                            }
                        />
                    </div>

                    <h4 className="mt-4 mb-3">Necessidades Ambientais</h4>
                    <div className="col-md-6 mb-3">
                        <label>Luminosidade</label>
                        <select
                            className="form-control"
                            value={form.light}
                            onChange={(e) => updateForm({ light: e.target.value })}
                        >
                            <option value="">Escolha</option>
                            <option value="facil">Sombra</option>
                            <option value="moderado">Meia Sombra</option>
                            <option value="dificil">Sol Pleno</option>
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
                            <option value="facil">Baixa</option>
                            <option value="moderado">Média</option>
                            <option value="dificil">Alta</option>
                        </select>
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Tamanho</label>
                        <input
                            type="text"
                            placeholder="Descreva o tamanho. Exemplo: Pequena, Média, Grande."
                            className="form-control"
                            value={form.size}
                            onChange={(e) =>
                                updateForm({ size: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Soil</label>
                        <input
                            type="text"
                            placeholder="Descreva o solo ideal para a planta. Exemplo: Solo bem drenado, arenoso, coriácea."
                            className="form-control"
                            value={form.soil}
                            onChange={(e) =>
                                updateForm({ soil: e.target.value })
                            }
                        />
                    </div>

                    <h4 className="mt-5 mb-4">Cuidados da Planta</h4>
                    <div className="col-md-12 mb-3">
                        <h5>Rega</h5>
                        <textarea
                            className="form-control"
                            placeholder="Faça uma descrição detalhada sobre a rega da planta, incluindo a frequência, quantidade de água e outras dicas relevantes para manter a planta saudável."
                            rows="4"
                            value={form.watering}
                            onChange={(e) =>
                                updateForm({
                                    watering: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Melhor horário</label>
                        <input
                            type="text"
                            placeholder="Exemplo: Manhã, Tarde, Noite"
                            className="form-control"
                            value={form.manha}
                            onChange={(e) =>
                                updateForm({ manha: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Quantidade</label>
                        <input
                            type="text"
                            placeholder="Descreva a quantidade de água necessária. Exemplo: 500ml por semana."
                            className="form-control"
                            value={form.amount}
                            onChange={(e) =>
                                updateForm({
                                    amount: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <h5>Fertilização</h5>
                        <textarea
                            className="form-control"
                            placeholder="Faça uma descrição detalhada sobre a fertilização da planta, incluindo a frequência, tipo de fertilizante recomendado e outras dicas relevantes para manter a planta saudável."
                            rows="4"
                            value={form.fertilizing}
                            onChange={(e) =>
                                updateForm({
                                    fertilizing: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Frequência</label>
                        <input
                            type="text"
                            placeholder="Descreva a frequência de fertilização. Exemplo: A cada 2 meses."
                            className="form-control"
                            value={form.frequency}
                            onChange={(e) =>
                                updateForm({ frequency: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>NPK recomendado</label>
                        <input
                            type="text"
                            placeholder="Descreva o NPK recomendado. Exemplo: 10-10-10"
                            className="form-control"
                            value={form.NPK}
                            onChange={(e) =>
                                updateForm({
                                    NPK: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <h5>Poda</h5>
                        <textarea
                            className="form-control"
                            placeholder="Faça uma descrição detalhada sobre a poda da planta, incluindo a frequência, técnicas recomendadas e outras dicas relevantes para manter a planta saudável."
                            rows="4"
                            value={form.pruning}
                            onChange={(e) =>
                                updateForm({
                                    pruning: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Época</label>
                        <input
                            type="text"
                            placeholder="Descreva a época de poda. Exemplo: Primavera"
                            className="form-control"
                            value={form.season}
                            onChange={(e) =>
                                updateForm({ season: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Ferramentas</label>
                        <input
                            type="text"
                            placeholder="Descreva as ferramentas recomendadas. Exemplo: Serrote, luvas de jardinagem."
                            className="form-control"
                            value={form.tools}
                            onChange={(e) =>
                                updateForm({
                                    tools: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <h5>Pragas e Doenças</h5>
                        <textarea
                            className="form-control"
                            placeholder="Faça uma descrição detalhada sobre as pragas e doenças que podem afetar a planta, incluindo os sintomas, métodos de controle e outras dicas relevantes para manter a planta saudável."
                            rows="4"
                            value={form.pests}
                            onChange={(e) =>
                                updateForm({
                                    pests: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Prevenção</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Descreva as medidas de prevenção contra pragas e doenças."
                            value={form.prevention}
                            onChange={(e) =>
                                updateForm({ prevention: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Monitoramento</label>
                        <input
                            type="text"
                            placeholder="Frequência e sinais de alerta para pragas ou doenças."
                            className="form-control"
                            value={form.monitoring}
                            onChange={(e) =>
                                updateForm({
                                    monitoring: e.target.value
                                })
                            }
                        />
                    </div>

                    <h4 className="mt-5 mb-4">Cultivo da Planta</h4>
                    <div className="col-md-12 mb-3">
                        <h5>Plantio</h5>
                        <textarea
                            className="form-control"
                            placeholder="Faça uma descrição detalhada sobre o plantio da planta, incluindo o processo de germinação, transplante e outras dicas relevantes para garantir um cultivo bem-sucedido."
                            rows="4"
                            value={form.planting}
                            onChange={(e) =>
                                updateForm({
                                    planting: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Estação</label>
                        <input
                            type="text"
                            placeholder="Descreva a estação ideal para o plantio. Exemplo: Primavera."
                            className="form-control"
                            value={form.station}
                            onChange={(e) =>
                                updateForm({ station: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Espaçamento entre mudas</label>
                        <input
                            type="text"
                            placeholder="Descreva o espaçamento recomendado entre as mudas. Exemplo: 30cm."
                            className="form-control"
                            value={form.spacing}
                            onChange={(e) =>
                                updateForm({
                                    spacing: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <h5>Exposição Solar</h5>
                        <textarea
                            className="form-control"
                            placeholder="Descreva a exposição solar ideal para o cultivo da planta, incluindo a quantidade de luz solar necessária e outras dicas relevantes para garantir um crescimento saudável."
                            rows="4"
                            value={form.exhibition}
                            onChange={(e) =>
                                updateForm({
                                    exhibition: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Sol diário</label>
                        <input
                            type="text"
                            placeholder="Descreva a quantidade de sol diário necessária. Exemplo: 4-6 horas."
                            className="form-control"
                            value={form.iluminosity}
                            onChange={(e) =>
                                updateForm({ iluminosity: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Proteção</label>
                        <input
                            type="text"
                            placeholder="Descreva o tipo de proteção necessária. Exemplo: Proteção contra vento."
                            className="form-control"
                            value={form.protection}
                            onChange={(e) =>
                                updateForm({
                                    protection: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-3">
                        <h5>Manutenção</h5>
                        <textarea
                            className="form-control"
                            placeholder="Faça uma descrição detalhada sobre a manutenção da planta, incluindo as práticas recomendadas para garantir um cultivo saudável e sustentável ao longo do tempo."
                            rows="4"
                            value={form.maintenance}
                            onChange={(e) =>
                                updateForm({
                                    maintenance: e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Temperatura ideal</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Descreva a temperatura ideal para o cultivo da planta. Exemplo: 20-25°C."
                            value={form.idealTemperature}
                            onChange={(e) =>
                                updateForm({ idealTemperature: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label>Tolerância</label>
                        <input
                            type="text"
                            placeholder="Descreva a tolerância da planta, como frio, calor, seca ou umidade excessiva."
                            className="form-control"
                            value={form.tolerance}
                            onChange={(e) =>
                                updateForm({
                                    tolerance: e.target.value
                                })
                            }
                        />
                    </div>

                </div>

                <input
                    type="submit"
                    value="Salvar Alterações"
                    className="btn btn-primary"
                />
            </form>
        </div>
    )
}