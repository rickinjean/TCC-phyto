import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const REACT_APP_YOUR_HOSTNAME = "http://localhost:5050";

export default function PlantDetails() {
  const [plant, setPlant] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();


  
useEffect(() => {
    async function getPlantData() {
      try {
        const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/${id}`);
        const data = await response.json();

        // Mapeamento dos campos que são IDs e precisam buscar detalhes na collection
        const fieldsToPopulate = {
          fruit: 'fruit',
          origin: 'origin',
          type: 'type',
          propagation: 'propagation',
          toxicity: 'toxicity',
          dificulty: 'dificulty',
          height: 'height',
          flowercolor: 'flowercolor',
          foliage: 'foliage',
          flowering: 'flowering',
          light: 'light',
          water: 'water',
          soil: 'soil',
          size: 'size',
          Filo: 'Filo',
          Classe: 'Classe',
          Ordem: 'Ordem',
          Family: 'Family',
          Genero: 'Genero',
          Especie: 'Especie',
          watering: 'watering',
          fertilizing: 'fertilizing',
          pruning: 'pruning',
          pests: 'pests',
          manha: 'manha',
          amount: 'amount',
          frequency: 'frequency',
          NPK: 'NPK',
          season: 'season',
          tools: 'tools',
          prevention: 'prevention',
          monitoring: 'monitoring',
          planting: 'planting',
          exhibition: 'exhibition',
          maintenance: 'maintenance',
          station: 'station',
          spacing: 'spacing',
          iluminosity: 'iluminosity',
          protection: 'protection',
          idealTemperature: 'idealTemperature',
          tolerance: 'tolerance'
        };

        // Busca todos os detalhes em paralelo
        await Promise.all(
          Object.entries(fieldsToPopulate).map(async ([field, endpoint]) => {
            if (data[field]) {
              try {
                const res = await fetch(`${REACT_APP_YOUR_HOSTNAME}/collections/${endpoint}`);
                const list = await res.json();
                data[`${field}Data`] = list.find(item => item._id === data[field]);
              } catch (err) {
                console.error(`Erro ao buscar ${endpoint}:`, err);
              }
            }
          })
        );

        setPlant(data);
      } catch (error) {
        console.error("Erro ao carregar dados da planta:", error);
      }
    }

    getPlantData();
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

      {plant.imagesPath?.length > 0 ? (
        <div id="plantImagesCarousel" className="carousel slide mb-4" data-bs-ride="carousel">
          <div className="carousel-indicators">
            {plant.imagesPath.map((_, index) => (
              <button
                type="button"
                key={index}
                data-bs-target="#plantImagesCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-current={index === 0 ? "true" : undefined}
                aria-label={`Imagem ${index + 1}`}
              />
            ))}
          </div>

          <div className="carousel-inner rounded-4 overflow-hidden" style={{ maxHeight: "420px" }}>
            {plant.imagesPath.map((src, index) => (
              <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                <img
                  src={`${REACT_APP_YOUR_HOSTNAME}${src}`}
                  alt={`${plant.name} ${index + 1}`}
                  className="d-block w-100"
                  style={{ maxHeight: "420px", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>

          {plant.imagesPath.length > 1 && (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#plantImagesCarousel"
                data-bs-slide="prev"
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Anterior</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#plantImagesCarousel"
                data-bs-slide="next"
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Próximo</span>
              </button>
            </>
          )}
        </div>
      ) : plant.imagePath ? (
        <div className="mb-4">
          <img
            src={`${REACT_APP_YOUR_HOSTNAME}${plant.imagePath}`}
            alt={plant.name}
            style={{ width: "100%", maxHeight: "420px", objectFit: "cover", borderRadius: "12px" }}
          />
        </div>
      ) : null}

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
                  <p><strong>Fruto:</strong> {plant.fruitData?.name || plant.fruit || "—"}</p>
                  <p><strong>Origem:</strong> {plant.originData?.name || plant.origin || "—"}</p>
                  <p><strong>Tipo:</strong> {plant.typeData?.name || plant.type || "—"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Propagação:</strong> {plant.propagationData?.name || plant.propagation || "—"}</p>
                  <p><strong>Toxicidade:</strong> {plant.toxicityData?.name || plant.toxicity || "—"}</p>
                  <p><strong>Dificuldade:</strong> {plant.dificultyData?.name || plant.dificulty || "—"}</p>
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
                  <p><strong>Altura:</strong> {plant.heightData?.name || plant.height || "—"}</p>
                  <p><strong>Cor da Flor:</strong> {plant.flowercolorData?.name || plant.flowercolor || "—"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Folhagem:</strong> {plant.foliageData?.name || plant.foliage || "—"}</p>
                  <p><strong>Floração:</strong> {plant.floweringData?.name || plant.flowering || "—" }</p>
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
                  <p><strong>Luz:</strong> {plant.lightData?.name || plant.light || "—"}</p>
                  <p><strong>Água:</strong> {plant.waterData?.name || plant.water || "—"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Solo:</strong> {plant.soilData?.name || plant.soil || "—"}</p>
                  <p><strong>Tamanho:</strong> {plant.sizeData?.name || plant.size || "—"}</p>
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
                  <p><strong>Filo:</strong> {plant.FiloData?.name || plant.Filo || "—"}</p>
                  <p><strong>Classe:</strong> {plant.ClasseData?.name || plant.Classe || "—"}</p>
                  <p><strong>Ordem:</strong> {plant.OrdemData?.name || plant.Ordem || "—"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Família:</strong> {plant.FamilyData?.name || plant.Family || "—"}</p>
                  <p><strong>Gênero:</strong> {plant.GeneroData?.name || plant.Genero || "—"}</p>
                  <p><strong>Especie:</strong> {plant.EspecieData?.name || plant.Especie || "—"}</p>
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
              <p><strong>Rega:</strong> {plant.wateringData?.name || plant.watering || "—"}</p>
              <p><strong>Fertilização:</strong> {plant.fertilizingData?.name || plant.fertilizing || "—"}</p>
              <p><strong>Poda:</strong> {plant.pruningData?.name || plant.pruning || "—"}</p>
              <p><strong>Pragas:</strong> {plant.pestsData?.name || plant.pests || "—"}</p>
              <hr />

              {/* Dicas de rega */}
              <h6 className="fw-bold">Dicas de Rega</h6>
              <p><strong>Melhor horário:</strong> {plant.manhaData?.name || plant.manha || "—"}</p>
              <p><strong>Quantidade:</strong> {plant.amountData?.name || plant.amount || "—"}</p>
              <hr />

              {/* Dicas de fertilização */}
              <h6 className="fw-bold">Fertilização</h6>
              <p><strong>Frequência:</strong> {plant.frequencyData?.name || plant.frequency || "—"}</p>
              <p><strong>NPK:</strong> {plant.NPKData?.name || plant.NPK || "—"}</p>
              <hr />

              {/* Poda */}
              <h6 className="fw-bold">Poda</h6>
              <p><strong>Época:</strong> {plant.seasonData?.name || plant.season || "—"}</p>
              <p><strong>Ferramentas:</strong> {plant.toolsData?.name || plant.tools || "—"}</p>
              <hr />

              {/* Pragas */}
              <h6 className="fw-bold">Controle de Pragas</h6>
              <p><strong>Prevenção:</strong> {plant.preventionData?.name || plant.prevention || "—"}</p>
              <p><strong>Monitoramento:</strong> {plant.monitoringData?.name || plant.monitoring || "—"}</p>

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
              <p><strong>Plantio:</strong> {plant.plantingData?.name || plant.planting || "—"}</p>
              <p><strong>Exposição Solar:</strong> {plant.exhibitionData?.name || plant.exhibition || "—"}</p>
              <p><strong>Manutenção:</strong> {plant.maintenanceData?.name || plant.maintenance || "—"}</p>
              <hr />

              {/* Plantio */}
              <h6 className="fw-bold">Plantio</h6>
              <p><strong>Estação:</strong> {plant.stationData?.name || plant.station || "—"}</p>
              <p><strong>Espaçamento entre mudas:</strong> {plant.spacingData?.name || plant.spacing || "—"}</p>
              <hr />

              {/* Exposição Solar */}
              <h6 className="fw-bold">Exposição Solar</h6>
              <p><strong>Sol diário:</strong> {plant.iluminosityData?.name || plant.iluminosity || "—"}</p>
              <p><strong>Proteção:</strong> {plant.protectionData?.name || plant.protection || "—"}</p>
              <hr />

              {/* Manutenção */}
              <h6 className="fw-bold">Manutenção</h6>
              <p><strong>Temperatura ideal:</strong> {plant.idealTemperatureData?.name || plant.idealTemperature || "—"}</p>
              <p><strong>Tolerância:</strong> {plant.toleranceData?.name || plant.tolerance || "—"}</p>
              <hr />

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}