import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../config";
import authFetch from "../authFetch";
import { decodeId } from "../idCodec";
import PlantImage from "./PlantImage";
import usePageTitle from "../usePageTitle";
import ListaPicker from "./ListaPicker";
import { PLACEHOLDER_DETAIL } from "../placeholderImg";
import { imgVariantProps } from "../getImageVariants";
import FavoriteButton from "./FavoriteButton";

function QuickBadge({ icon, label, value }) {
  if (!value || value === "—") return null;
  return (
    <div className="plant-details-badge">
      <span className="plant-details-badge__icon">{icon}</span>
      <span className="plant-details-badge__label">{label}</span>
      <span className="plant-details-badge__value">{value}</span>
    </div>
  );
}

function InfoItem({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <div className="plant-details-data-item">
      <p className="plant-details-label">{label}</p>
      <p className="plant-details-value">{value}</p>
    </div>
  );
}

function SectionCard({ title, icon, children, className = "" }) {
  return (
    <section className={`plant-details-card mb-4 ${className}`}>
      <h2 className="plant-details-card-title">
        {icon && <span className="plant-details-card-icon">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function TaxonomyStep({ label, value, arrow = true }) {
  if (!value) return null;
  return (
    <>
      <div className="plant-details-taxonomy__item">
        <span className="plant-details-taxonomy__rank">{label}</span>
        <div className="plant-details-taxonomy__spine" aria-hidden="true">
          <span className="plant-details-taxonomy__node" />
        </div>
        <span className="plant-details-taxonomy__value">{value}</span>
      </div>
      {arrow && <span className="plant-details-taxonomy__arrow" aria-hidden="true">→</span>}
    </>
  );
}

function SkeletonLoader() {
  return (
    <div className="plant-details-skeleton">
      <div className="plant-details-skeleton__header">
        <div className="plant-details-skeleton__back skeleton-pulse" />
        <div className="plant-details-skeleton__title skeleton-pulse" />
        <div className="plant-details-skeleton__subtitle skeleton-pulse" />
      </div>
      <div className="container plant-details-media-shell">
        <div className="plant-details-skeleton__image skeleton-pulse" />
        <div className="plant-details-skeleton__badges">
          {[1,2,3,4].map(i => <div key={i} className="plant-details-skeleton__badge skeleton-pulse" />)}
        </div>
        {[1,2].map(i => (
          <div key={i} className="plant-details-skeleton__card skeleton-pulse" />
        ))}
      </div>
    </div>
  );
}

const COLLECTION_MAP = {
  fruit: "fruit", origin: "origin", type: "type",
  propagation: "propagation", toxicity: "toxicity", dificulty: "dificulty",
  height: "height", flowercolor: "flowercolor", foliage: "foliage",
  flowering: "flowering", light: "light", water: "water", soil: "soil",
  size: "size", manha: "manha", amount: "amount", frequency: "frequency",
  NPK: "NPK", season: "season", tools: "tools", prevention: "prevention",
  monitoring: "monitoring", station: "station", spacing: "spacing",
  iluminosity: "iluminosity", protection: "protection",
  idealTemperature: "idealTemperature", tolerance: "tolerance",
};

// Campos de texto livre: são armazenados diretamente no documento da planta,
// NÃO como referência de ObjectId em uma coleção.
const TEXT_FIELDS = [
  "watering", "fertilizing", "pruning", "pests",
  "planting", "exhibition", "maintenance",
  "Filo", "Classe", "Ordem", "Family", "Genero", "Especie",
];

export default function PlantDetails({ canFavorite = false }) {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  usePageTitle(plant ? plant.name : "Planta", plant?.simpleDescription, `/plantdetails/${id}`)
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pickerAberto, setPickerAberto] = useState(false);
  const [corColecao, setCorColecao] = useState(null);
  const [colecoes, setColecoes] = useState([]);
  const navigate = useNavigate();
  const realId = decodeId(id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/plant/${realId}`);
        if (!response.ok) { if (!cancelled) setNotFound(true); return; }

        const data = await response.json();
        if (!data || !data.name) { if (!cancelled) setNotFound(true); return; }

        const collectionsRes = await fetch(`${API_URL}/collections/all`);
        const allCollections = collectionsRes.ok ? await collectionsRes.json() : {};

        const resolved = {};
        for (const field of Object.keys(COLLECTION_MAP)) {
          const colName = COLLECTION_MAP[field];
          const list = allCollections[colName];
          if (data[field] && list) {
            const match = list.find(item => item._id === data[field]);
            resolved[`${field}Data`] = match ? match.name : null;
          } else {
            resolved[`${field}Data`] = null;
          }
        }

        if (!cancelled) {
          setPlant({ ...data, ...resolved });
        }

      } catch (error) {
        console.error("Erro ao carregar planta:", error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [realId]);

  // Cor do coração = cor da coleção mais recente que contém esta planta.
  // Também reexecuta ao abrir/fechar o picker para refletir mudanças.
  useEffect(() => {
    if (!canFavorite) return;
    let cancelled = false;
    async function carregarCor() {
      try {
        const res = await authFetch(`${API_URL}/userlists?plantId=${realId}`);
        if (!cancelled && res && res.ok) {
          const data = await res.json();
          const comPlanta = data.filter(l => l.contains);
          setColecoes(comPlanta);
          setCorColecao(comPlanta.length ? comPlanta[0].color : null);
        }
      } catch { /* ignore */ }
    }
    carregarCor();
    return () => { cancelled = true; };
  }, [canFavorite, realId, pickerAberto]);

  if (notFound) {
    return (
      <div className="plant-details-page plant-details-loading">
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
          <h2>Planta não encontrada</h2>
          <p style={{ color: "#71827a", marginBottom: "1.5rem" }}>
            O registro que você procura não existe ou foi removido.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/plantlist")}>
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  if (loading || !plant) {
    return (
      <div className="plant-details-page">
        <SkeletonLoader />
      </div>
    );
  }

  const v = (field) => {
    const resolved = plant[`${field}Data`];
    if (resolved) return resolved;
    if (TEXT_FIELDS.includes(field)) return plant[field] || null;
    return null;
  };

  const hasImages = plant.imagesPath?.length > 0;
  const hasSingleImage = !hasImages && plant.imagePath;
  const hasAnyImage = hasImages || hasSingleImage;
  const total = hasImages ? plant.imagesPath.length : 0;
  const textoColecoes = colecoes.length > 1
    ? `Em ${colecoes.length} coleções: ${colecoes.map(c => c.name).filter(Boolean).join(", ")}`
    : colecoes.length === 1
      ? "Em uma coleção — tocar para gerenciar"
      : "Adicionar a uma coleção";

  const goPrev = () => setActiveIndex(a => (a - 1 + total) % total);
  const goNext = () => setActiveIndex(a => (a + 1) % total);

  return (
    <div className="plant-details-page">
      {/* ── HEADER ── */}
      <header className="plant-details-header">
        <div className="container plant-details-shell">
          <button className="btn plant-details-back" onClick={() => navigate(-1)} type="button">
            <span aria-hidden="true">←</span> Voltar
          </button>
          <div className="plant-details-header__title-row">
            <div>
              <h1 className="plant-details-title">{plant.name}</h1>
              <p className="plant-details-scientific-name">{plant.scientificName}</p>
            </div>
            {canFavorite && (
              <FavoriteButton
                variant="details"
                corColecao={corColecao}
                qtdColecoes={colecoes.length}
                texto={textoColecoes}
                onClick={() => setPickerAberto(true)}
              />
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="container plant-details-media-shell">

          <div className="row g-4 g-lg-5 mb-4 align-items-stretch">
            {/* ── IMAGEM + SOBRE ── */}
            <div className="col-12 col-lg-7">
              {hasAnyImage ? (
                hasImages ? (
                  <>
                    <div className="plant-details-carousel">
                      <div className="plant-details-carousel-inner">
                        <PlantImage
                          src={`${API_URL}${plant.imagesPath[activeIndex]}`}
                          alt={`${plant.name} ${activeIndex + 1}`}
                          className="plant-details-image"
                          fallback={PLACEHOLDER_DETAIL}
                          sizesAttr="(max-width: 991px) 100vw, 58vw"
                          {...imgVariantProps(plant.imagesMeta, plant.imagesPath[activeIndex], API_URL)}
                        />
                      </div>
                      {total > 1 && (
                        <>
                          <button className="plant-details-carousel__arrow is-prev" type="button" onClick={goPrev} aria-label="Imagem anterior">
                            <span aria-hidden="true">‹</span>
                          </button>
                          <button className="plant-details-carousel__arrow is-next" type="button" onClick={goNext} aria-label="Próxima imagem">
                            <span aria-hidden="true">›</span>
                          </button>
                        </>
                      )}
                    </div>
                    {total > 1 && (
                      <div className="plant-details-gallery">
                        {plant.imagesPath.map((src, i) => (
                          <button
                            type="button"
                            key={i}
                            className={`plant-details-gallery__thumb ${i === activeIndex ? "is-active" : ""}`}
                            onClick={() => setActiveIndex(i)}
                            aria-label={`Ver imagem ${i + 1}`}
                          >
                            <PlantImage src={`${API_URL}${src}`} alt={`${plant.name} ${i + 1}`} className="plant-details-gallery__img" fallback={PLACEHOLDER_DETAIL} sizesAttr="56px" {...imgVariantProps(plant.imagesMeta, src, API_URL)} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="plant-details-carousel">
                    <div className="plant-details-carousel-inner">
                      <PlantImage src={`${API_URL}${plant.imagePath}`} alt={plant.name} className="plant-details-image" fallback={PLACEHOLDER_DETAIL} sizesAttr="(max-width: 991px) 100vw, 58vw" {...imgVariantProps(plant.imagesMeta, plant.imagePath, API_URL)} />
                    </div>
                  </div>
                )
              ) : (
                <div className="plant-details-carousel">
                  <div className="plant-details-carousel-inner">
                    <img src={PLACEHOLDER_DETAIL} alt="Sem imagem disponível" className="plant-details-image" />
                  </div>
                </div>
              )}
            </div>

            {/* ── SOBRE A PLANTA (texto completo) ── */}
            <div className="col-12 col-lg-5">
              <div className="plant-details-aside d-flex flex-column h-100">
                <div className="plant-details-quick-badges mb-3">
                  <QuickBadge icon="🌿" label="Tipo" value={v("type")} />
                  <QuickBadge icon="🌍" label="Origem" value={v("origin")} />
                  <QuickBadge icon="⚠️" label="Toxicidade" value={v("toxicity")} />
                  <QuickBadge icon="🎯" label="Dificuldade" value={v("dificulty")} />
                </div>

                {plant.description && (
                  <section className="plant-details-simple-desc flex-grow-1">
                    <h2 className="plant-details-section-title">Sobre a Planta</h2>
                    <p className="plant-details-description-text">
                      {plant.description}
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="container plant-details-info-shell">

          <div className="row g-4 mb-4">
            {/* ── CARACTERÍSTICAS FÍSICAS ── */}
            <div className="col-lg-6">
              <SectionCard title="Características Físicas" icon="🌿">
                <div className="plant-details-data-grid plant-details-data-grid--4">
                  <InfoItem label="Tipo" value={v("type")} />
                  <InfoItem label="Altura" value={v("height")} />
                  <InfoItem label="Cor da Flor" value={v("flowercolor")} />
                  <InfoItem label="Folhagem" value={v("foliage")} />
                  <InfoItem label="Floração" value={v("flowering")} />
                  <InfoItem label="Tamanho" value={v("size")} />
                  <InfoItem label="Fruto" value={v("fruit")} />
                  <InfoItem label="Propagação" value={v("propagation")} />
                </div>
              </SectionCard>
            </div>

            {/* ── NECESSIDADES AMBIENTAIS ── */}
            <div className="col-lg-6">
              <SectionCard title="Necessidades Ambientais" icon="☀️">
                <div className="plant-details-env-row">
                  <div className="plant-details-env-item">
                    <span className="plant-details-env-item__icon">☀️</span>
                    <span className="plant-details-env-item__label">Luz</span>
                    <span className="plant-details-env-item__value">{v("light") || "—"}</span>
                  </div>
                  <div className="plant-details-env-item">
                    <span className="plant-details-env-item__icon">💧</span>
                    <span className="plant-details-env-item__label">Água</span>
                    <span className="plant-details-env-item__value">{v("water") || "—"}</span>
                  </div>
                  <div className="plant-details-env-item">
                    <span className="plant-details-env-item__icon">🪴</span>
                    <span className="plant-details-env-item__label">Solo</span>
                    <span className="plant-details-env-item__value">{v("soil") || "—"}</span>
                  </div>
                  <div className="plant-details-env-item">
                    <span className="plant-details-env-item__icon">🌡️</span>
                    <span className="plant-details-env-item__label">Temperatura</span>
                    <span className="plant-details-env-item__value">{v("idealTemperature") || "—"}</span>
                  </div>
                </div>
                <div className="plant-details-data-grid plant-details-data-grid--3 mt-3">
                  <InfoItem label="Horas de Sol" value={v("iluminosity")} />
                  <InfoItem label="Tolerância" value={v("tolerance")} />
                  <InfoItem label="Proteção Climática" value={v("protection")} />
                </div>
              </SectionCard>
            </div>
          </div>

          {/* ── CLASSIFICAÇÃO TAXONÔMICA ── */}
          <SectionCard title="Classificação Taxonômica" icon="🧬">
            <div className="plant-details-taxonomy">
              <TaxonomyStep label="Filo" value={v("Filo")} />
              <TaxonomyStep label="Classe" value={v("Classe")} />
              <TaxonomyStep label="Ordem" value={v("Ordem")} />
              <TaxonomyStep label="Família" value={v("Family")} />
              <TaxonomyStep label="Gênero" value={v("Genero")} />
              <TaxonomyStep label="Espécie" value={v("Especie")} arrow={false} />
            </div>
          </SectionCard>

          {/* ── CUIDADOS + CULTIVO ── */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <SectionCard title="Cuidados da Planta" icon="🤲" className="h-100">
                <div className="plant-details-flow-list">
                  <p className="plant-details-label">Rega</p>
                  <p className="plant-details-value">{v("watering") || "—"}</p>
                  <p className="plant-details-label">Horário Ideal de Rega</p>
                  <p className="plant-details-value">{v("manha") || "—"}</p>
                  <p className="plant-details-label">Quantidade de Rega</p>
                  <p className="plant-details-value">{v("amount") || "—"}</p>
                  <p className="plant-details-label">Poda</p>
                  <p className="plant-details-value">{v("pruning") || "—"}</p>
                  <div className="plant-details-data-grid mt-3">
                    <InfoItem label="Época de Poda" value={v("season")} />
                    <InfoItem label="Ferramenta de Poda" value={v("tools")} />
                  </div>
                </div>
              </SectionCard>
            </div>
            <div className="col-lg-6">
              <SectionCard title="Cultivo da Planta" icon="🌱" className="h-100">
                <div className="plant-details-flow-list">
                  <p className="plant-details-label">Plantio</p>
                  <p className="plant-details-value">{v("planting") || "—"}</p>
                  <p className="plant-details-label">Estação</p>
                  <p className="plant-details-value">{v("station") || "—"}</p>
                  <p className="plant-details-label">Espaçamento</p>
                  <p className="plant-details-value">{v("spacing") || "—"}</p>
                  <p className="plant-details-label">Exposição</p>
                  <p className="plant-details-value">{v("exhibition") || "—"}</p>
                  <p className="plant-details-label">Manutenção</p>
                  <p className="plant-details-value">{v("maintenance") || "—"}</p>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* ── ADUBAÇÃO + PRAGAS E MONITORAMENTO ── */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <SectionCard title="Adubação" icon="🧪" className="h-100">
                <div className="plant-details-flow-list">
                  <p className="plant-details-label">Adubação</p>
                  <p className="plant-details-value">{v("fertilizing") || "—"}</p>
                  <p className="plant-details-label">Frequência de Adubação</p>
                  <p className="plant-details-value">{v("frequency") || "—"}</p>
                  <p className="plant-details-label">Tipo de NPK</p>
                  <p className="plant-details-value">{v("NPK") || "—"}</p>
                </div>
              </SectionCard>
            </div>
            <div className="col-lg-6">
              <SectionCard title="Pragas e Monitoramento" icon="🐛" className="h-100">
                <div className="plant-details-flow-list">
                  <p className="plant-details-label">Pragas Comuns</p>
                  <p className="plant-details-value">{v("pests") || "—"}</p>
                  <p className="plant-details-label">Prevenção</p>
                  <p className="plant-details-value">{v("prevention") || "—"}</p>
                  <p className="plant-details-label">Monitoramento</p>
                  <p className="plant-details-value">{v("monitoring") || "—"}</p>
                </div>
              </SectionCard>
            </div>
          </div>

        </div>
      </main>

      {canFavorite && (
        <ListaPicker
          aberto={pickerAberto}
          plantaId={realId}
          plantaNome={plant.name}
          onFechar={() => setPickerAberto(false)}
        />
      )}
    </div>
  );
}