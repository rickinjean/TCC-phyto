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





  if (!plant) return <div style={{ background: "#3d3d3d", minHeight: "100vh", color: "#f0f0f0" }} className="d-flex align-items-center justify-content-center"><p>Carregando...</p></div>;

  return (
    <div style={{ background: "#3d3d3d", minHeight: "100vh", color: "#f0f0f0" }}>
      {/* HEADER COM BOTÃO VOLTAR */}
      <div style={{ background: "#444444", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="container">
          <button
            className="btn btn-outline-light mb-3 btn-sm"
            onClick={() => navigate(-1)}
            style={{ borderColor: "#7db3dd", color: "#7db3dd" }}
          >
            ← Voltar
          </button>
          <h1 className="fw-bold" style={{ color: "#f0f0f0", marginBottom: "0.5rem" }}>{plant.name}</h1>
          <h5 style={{ color: "#b0b0b0", fontStyle: "italic" }}>{plant.scientificName}</h5>
        </div>
      </div>

      {/* CAROUSEL DE IMAGENS */}
      <div className="container" style={{ marginTop: "2rem", marginBottom: "2rem" }}>
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
                  style={{ backgroundColor: "#7db3dd" }}
                />
              ))}
            </div>

            <div className="carousel-inner rounded-4 overflow-hidden" style={{ maxHeight: "500px" }}>
              {plant.imagesPath.map((src, index) => (
                <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                  <img
                    src={`${REACT_APP_YOUR_HOSTNAME}${src}`}
                    alt={`${plant.name} ${index + 1}`}
                    className="d-block w-100"
                    style={{ maxHeight: "500px", objectFit: "cover" }}
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
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#plantImagesCarousel"
                  data-bs-slide="next"
                >
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                </button>
              </>
            )}
          </div>
        ) : plant.imagePath ? (
          <div className="mb-4">
            <img
              src={`${REACT_APP_YOUR_HOSTNAME}${plant.imagePath}`}
              alt={plant.name}
              style={{ width: "100%", maxHeight: "500px", objectFit: "cover", borderRadius: "12px" }}
            />
          </div>
        ) : null}

        {/* DESCRIÇÃO */}
        <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", marginBottom: "2rem", borderLeft: "4px solid #7db3dd" }}>
          <h4 style={{ color: "#7db3dd", marginBottom: "1rem" }}>Descrição</h4>
          <p style={{ color: "#d0d0d0", lineHeight: "1.6" }}>{plant.description}</p>
        </div>
      </div>

      {/* GRID DE INFORMAÇÕES */}
      <div className="container" style={{ marginBottom: "2rem" }}>
        <div className="row g-4">

        {/* INFORMAÇÕES BOTÂNICAS */}
        <div className="col-lg-6 mb-4">
          <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", height: "100%", borderLeft: "4px solid #7db3dd" }}>
            <h5 style={{ color: "#7db3dd", marginBottom: "1.5rem" }}>Informações Botânicas</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Fruto</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.fruitData?.name || plant.fruit || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Origem</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.originData?.name || plant.origin || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Tipo</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.typeData?.name || plant.type || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Propagação</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.propagationData?.name || plant.propagation || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Toxicidade</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.toxicityData?.name || plant.toxicity || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Dificuldade</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.dificultyData?.name || plant.dificulty || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARACTERÍSTICAS FÍSICAS */}
        <div className="col-lg-6 mb-4">
          <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", height: "100%", borderLeft: "4px solid #7db3dd" }}>
            <h5 style={{ color: "#7db3dd", marginBottom: "1.5rem" }}>Características Físicas</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Altura</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.heightData?.name || plant.height || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Cor da Flor</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.flowercolorData?.name || plant.flowercolor || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Folhagem</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.foliageData?.name || plant.foliage || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Floração</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.floweringData?.name || plant.flowering || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Tamanho</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.sizeData?.name || plant.size || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NECESSIDADES AMBIENTAIS */}
        <div className="col-lg-6 mb-4">
          <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", height: "100%", borderLeft: "4px solid #7db3dd" }}>
            <h5 style={{ color: "#7db3dd", marginBottom: "1.5rem" }}>Necessidades Ambientais</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Luz</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.lightData?.name || plant.light || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Água</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.waterData?.name || plant.water || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Solo</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.soilData?.name || plant.soil || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CLASSIFICAÇÃO TAXONÔMICA */}
        <div className="col-lg-6 mb-4">
          <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", height: "100%", borderLeft: "4px solid #7db3dd" }}>
            <h5 style={{ color: "#7db3dd", marginBottom: "1.5rem" }}>Classificação Taxonômica</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Filo</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.FiloData?.name || plant.Filo || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Classe</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.ClasseData?.name || plant.Classe || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Ordem</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.OrdemData?.name || plant.Ordem || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Família</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.FamilyData?.name || plant.Family || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Gênero</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.GeneroData?.name || plant.Genero || "—"}</p>
              </div>
              <div>
                <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Espécie</p>
                <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.EspecieData?.name || plant.Especie || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CUIDADOS */}
        <div className="col-lg-6 mb-4">
          <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", height: "100%", borderLeft: "4px solid #7db3dd" }}>
            <h5 style={{ color: "#7db3dd", marginBottom: "1.5rem" }}>Cuidados da Planta</h5>
            
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Rega</p>
              <p style={{ color: "#f0f0f0", fontWeight: 600, marginBottom: "1rem" }}>{plant.wateringData?.name || plant.watering || "—"}</p>
              
              <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Fertilização</p>
              <p style={{ color: "#f0f0f0", fontWeight: 600, marginBottom: "1rem" }}>{plant.fertilizingData?.name || plant.fertilizing || "—"}</p>
              
              <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Poda</p>
              <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.pruningData?.name || plant.pruning || "—"}</p>
            </div>
          </div>
        </div>

        {/* CULTIVO */}
        <div className="col-lg-6 mb-4">
          <div style={{ background: "#4a4a4a", padding: "2rem", borderRadius: "12px", height: "100%", borderLeft: "4px solid #7db3dd" }}>
            <h5 style={{ color: "#7db3dd", marginBottom: "1.5rem" }}>Cultivo da Planta</h5>
            
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Plantio</p>
              <p style={{ color: "#f0f0f0", fontWeight: 600, marginBottom: "1rem" }}>{plant.plantingData?.name || plant.planting || "—"}</p>
              
              <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Estação</p>
              <p style={{ color: "#f0f0f0", fontWeight: 600, marginBottom: "1rem" }}>{plant.stationData?.name || plant.station || "—"}</p>
              
              <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginBottom: "0.3rem" }}>Temperatura Ideal</p>
              <p style={{ color: "#f0f0f0", fontWeight: 600 }}>{plant.idealTemperatureData?.name || plant.idealTemperature || "—"}</p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}