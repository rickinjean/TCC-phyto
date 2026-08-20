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
          fruit: "fruit",
          origin: "origin",
          type: "type",
          propagation: "propagation",
          toxicity: "toxicity",
          dificulty: "dificulty",
          height: "height",
          flowercolor: "flowercolor",
          foliage: "foliage",
          flowering: "flowering",
          light: "light",
          water: "water",
          soil: "soil",
          size: "size",
          Filo: "Filo",
          Classe: "Classe",
          Ordem: "Ordem",
          Family: "Family",
          Genero: "Genero",
          Especie: "Especie",
          watering: "watering",
          fertilizing: "fertilizing",
          pruning: "pruning",
          pests: "pests",
          manha: "manha",
          amount: "amount",
          frequency: "frequency",
          NPK: "NPK",
          season: "season",
          tools: "tools",
          prevention: "prevention",
          monitoring: "monitoring",
          planting: "planting",
          exhibition: "exhibition",
          maintenance: "maintenance",
          station: "station",
          spacing: "spacing",
          iluminosity: "iluminosity",
          protection: "protection",
          idealTemperature: "idealTemperature",
          tolerance: "tolerance",
        };

        // Busca todos os detalhes em paralelo
        await Promise.all(
          Object.entries(fieldsToPopulate).map(async ([field, endpoint]) => {
            if (data[field]) {
              try {
                const res = await fetch(`${REACT_APP_YOUR_HOSTNAME}/collections/${endpoint}`);
                const list = await res.json();
                data[`${field}Data`] = list.find((item) => item._id === data[field]);
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

  if (!plant) {
    return (
      <div className="plant-details-page plant-details-loading">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="plant-details-page">
      <header className="plant-details-header">
        <div className="container plant-details-shell">
          <button
            className="btn plant-details-back"
            onClick={() => navigate(-1)}
            type="button"
          >
            <span aria-hidden="true">←</span> Voltar
          </button>

          <h1 className="plant-details-title">{plant.name}</h1>
          <p className="plant-details-scientific-name">{plant.scientificName}</p>
        </div>
      </header>

      <main>
        <div className="container plant-details-media-shell">
          {plant.imagesPath?.length > 0 ? (
            <div id="plantImagesCarousel" className="carousel slide plant-details-carousel mb-4" data-bs-ride="carousel">
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

              <div className="carousel-inner plant-details-carousel-inner">
                {plant.imagesPath.map((src, index) => (
                  <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                    <img
                      src={`${REACT_APP_YOUR_HOSTNAME}${src}`}
                      alt={`${plant.name} ${index + 1}`}
                      className="d-block w-100 plant-details-image"
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
                    aria-label="Imagem anterior"
                  >
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#plantImagesCarousel"
                    data-bs-slide="next"
                    aria-label="Próxima imagem"
                  >
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  </button>
                </>
              )}
            </div>
          ) : plant.imagePath ? (
            <div className="plant-details-single-image mb-4">
              <img
                src={`${REACT_APP_YOUR_HOSTNAME}${plant.imagePath}`}
                alt={plant.name}
                className="plant-details-image plant-details-image--single"
              />
            </div>
          ) : null}

          <section className="plant-details-description">
            <h2 className="plant-details-section-title">Descrição</h2>
            <p className="plant-details-description-text">{plant.description}</p>
          </section>
        </div>

        <div className="container plant-details-info-shell">
          <div className="row g-4">
            <div className="col-lg-6 mb-4">
              <section className="plant-details-card">
                <h2 className="plant-details-card-title">Informações Botânicas</h2>
                <div className="plant-details-data-grid">
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Fruto</p>
                    <p className="plant-details-value">{plant.fruitData?.name || plant.fruit || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Origem</p>
                    <p className="plant-details-value">{plant.originData?.name || plant.origin || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Tipo</p>
                    <p className="plant-details-value">{plant.typeData?.name || plant.type || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Propagação</p>
                    <p className="plant-details-value">{plant.propagationData?.name || plant.propagation || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Toxicidade</p>
                    <p className="plant-details-value">{plant.toxicityData?.name || plant.toxicity || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Dificuldade</p>
                    <p className="plant-details-value">{plant.dificultyData?.name || plant.dificulty || "—"}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-lg-6 mb-4">
              <section className="plant-details-card">
                <h2 className="plant-details-card-title">Características Físicas</h2>
                <div className="plant-details-data-grid">
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Altura</p>
                    <p className="plant-details-value">{plant.heightData?.name || plant.height || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Cor da Flor</p>
                    <p className="plant-details-value">{plant.flowercolorData?.name || plant.flowercolor || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Folhagem</p>
                    <p className="plant-details-value">{plant.foliageData?.name || plant.foliage || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Floração</p>
                    <p className="plant-details-value">{plant.floweringData?.name || plant.flowering || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Tamanho</p>
                    <p className="plant-details-value">{plant.sizeData?.name || plant.size || "—"}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-lg-6 mb-4">
              <section className="plant-details-card">
                <h2 className="plant-details-card-title">Necessidades Ambientais</h2>
                <div className="plant-details-data-grid">
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Luz</p>
                    <p className="plant-details-value">{plant.lightData?.name || plant.light || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Água</p>
                    <p className="plant-details-value">{plant.waterData?.name || plant.water || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Solo</p>
                    <p className="plant-details-value">{plant.soilData?.name || plant.soil || "—"}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-lg-6 mb-4">
              <section className="plant-details-card">
                <h2 className="plant-details-card-title">Classificação Taxonômica</h2>
                <div className="plant-details-data-grid">
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Filo</p>
                    <p className="plant-details-value">{plant.FiloData?.name || plant.Filo || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Classe</p>
                    <p className="plant-details-value">{plant.ClasseData?.name || plant.Classe || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Ordem</p>
                    <p className="plant-details-value">{plant.OrdemData?.name || plant.Ordem || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Família</p>
                    <p className="plant-details-value">{plant.FamilyData?.name || plant.Family || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Gênero</p>
                    <p className="plant-details-value">{plant.GeneroData?.name || plant.Genero || "—"}</p>
                  </div>
                  <div className="plant-details-data-item">
                    <p className="plant-details-label">Espécie</p>
                    <p className="plant-details-value">{plant.EspecieData?.name || plant.Especie || "—"}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-lg-6 mb-4">
              <section className="plant-details-card">
                <h2 className="plant-details-card-title">Cuidados da Planta</h2>
                <div className="plant-details-flow-list">
                  <p className="plant-details-label">Rega</p>
                  <p className="plant-details-value">{plant.wateringData?.name || plant.watering || "—"}</p>

                  <p className="plant-details-label">Fertilização</p>
                  <p className="plant-details-value">{plant.fertilizingData?.name || plant.fertilizing || "—"}</p>

                  <p className="plant-details-label">Poda</p>
                  <p className="plant-details-value">{plant.pruningData?.name || plant.pruning || "—"}</p>
                </div>
              </section>
            </div>

            <div className="col-lg-6 mb-4">
              <section className="plant-details-card">
                <h2 className="plant-details-card-title">Cultivo da Planta</h2>
                <div className="plant-details-flow-list">
                  <p className="plant-details-label">Plantio</p>
                  <p className="plant-details-value">{plant.plantingData?.name || plant.planting || "—"}</p>

                  <p className="plant-details-label">Estação</p>
                  <p className="plant-details-value">{plant.stationData?.name || plant.station || "—"}</p>

                  <p className="plant-details-label">Temperatura Ideal</p>
                  <p className="plant-details-value">{plant.idealTemperatureData?.name || plant.idealTemperature || "—"}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
