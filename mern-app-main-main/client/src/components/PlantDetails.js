import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const REACT_APP_YOUR_HOSTNAME = "http://localhost:5050";

export default function PlantDetails() {
  const [plant, setPlant] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function getPlant() {
      const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/${id}`);
      const data = await response.json();
      setPlant(data);
    }

    getPlant();
  }, [id]);

  if (!plant) return <p className="text-center mt-5">Carregando...</p>;

  return (
    <div className="container mt-4 mb-5">
      {/* BOTÃO VOLTAR */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate(-1)}
      >
        ← Voltar
      </button>

      {/* HEADER */}
      <div className="mb-4">
        <h1 className="fw-bold">{plant.name}</h1>
        <h5 className="text-muted fst-italic">
          {plant.scientificName}
        </h5>
      </div>

      {/* DESCRIÇÃO */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h4 className="text-success">Descrição</h4>
          <p>{plant.description}</p>
        </div>
      </div>

      {/* GRID DE INFORMAÇÕES */}
      <div className="row">

        {/* INFORMAÇÕES GERAIS */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="text-success">Informações Botânicas</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Fruto:</strong> {plant.fruit}</p>
                  <p><strong>Origem:</strong> {plant.origin}</p>
                  <p><strong>Tipo:</strong> {plant.type}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Propagação:</strong> {plant.propagation}</p>
                  <p><strong>Toxicidade:</strong> {plant.toxicity}</p>
                  <p><strong>Dificuldade:</strong> {plant.dificulty}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARACTERÍSTICAS */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="text-success">Características Físicas</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Altura:</strong> {plant.height}</p>
                  <p><strong>Cor da Flor:</strong> {plant.flowercolor}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Folhagem:</strong> {plant.foliage}</p>
                  <p><strong>Floração:</strong> {plant.flowering}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NECESSIDADES */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="text-success">Necessidades Ambientais</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Luz:</strong> {plant.light}</p>
                  <p><strong>Água:</strong> {plant.water}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Solo:</strong> {plant.soil}</p>
                  <p><strong>Tamanho:</strong> {plant.size}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Classificação Taxonômica */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="text-success">Classificação Taxonômica</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Filo:</strong> {plant.Filo}</p>
                  <p><strong>Classe:</strong> {plant.Classe}</p>
                  <p><strong>Ordem:</strong> {plant.Ordem}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Família:</strong> {plant.Family}</p>
                  <p><strong>Gênero:</strong> {plant.Gênero}</p>
                  <p><strong>Especie:</strong> {plant.Especie}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUIDADOS da Planta */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="text-success mb-3">Cuidados da Planta</h5>

              {/* Cuidados básicos */}
              <h6 className="fw-bold mt-2">Cuidados Gerais</h6>
              <p><strong>Rega:</strong> {plant.watering}</p>
              <p><strong>Fertilização:</strong> {plant.fertilizing}</p>
              <p><strong>Poda:</strong> {plant.pruning}</p>
              <p><strong>Pragas:</strong> {plant.pests}</p>
              <hr />

              {/* Dicas de rega */}
              <h6 className="fw-bold">Dicas de Rega</h6>
              <p><strong>Melhor horário:</strong> {plant.manha}</p>
              <p><strong>Quantidade:</strong> {plant.amount}</p>
              <hr />

              {/* Dicas de fertilização */}
              <h6 className="fw-bold">Fertilização</h6>
              <p><strong>Frequência:</strong> {plant.frequency}</p>
              <p><strong>NPK:</strong> {plant.NPK}</p>
              <hr />

              {/* Poda */}
              <h6 className="fw-bold">Poda</h6>
              <p><strong>Época:</strong> {plant.season}</p>
              <p><strong>Ferramentas:</strong> {plant.tools}</p>
              <hr />

              {/* Pragas */}
              <h6 className="fw-bold">Controle de Pragas</h6>
              <p><strong>Prevenção:</strong> {plant.prevention}</p>
              <p><strong>Monitoramento:</strong> {plant.monitoring}</p>

            </div>
          </div>
        </div>

        {/* Cultivo da Planta */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="text-success mb-3">Cultivo da Planta</h5>

              {/* Cuidados básicos */}
              <h6 className="fw-bold mt-2">Cuidados Gerais</h6>
              <p><strong>Plantio:</strong> {plant.planting}</p>
              <p><strong>Exposição Solar:</strong> {plant.luminosity}</p>
              <p><strong>Manutenção:</strong> {plant.maintenance}</p>
              <hr />

              {/* Plantio */}
              <h6 className="fw-bold">Plantio</h6>
              <p><strong>Estação:</strong> {plant.station}</p>
              <p><strong>Espaçamento entre mudas:</strong> {plant.spacing}</p>
              <hr />

              {/* Exposição Solar */}
              <h6 className="fw-bold">Exposição Solar</h6>
              <p><strong>Sol diário:</strong> {plant.luminosity}</p>
              <p><strong>Proteção:</strong> {plant.protection}</p>
              <hr />

              {/* Manutenção */}
              <h6 className="fw-bold">Manutenção</h6>
              <p><strong>Temperatura ideal:</strong> {plant.idealTemperature}</p>
              <p><strong>Tolerância:</strong> {plant.tolerance}</p>
              <hr />

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}