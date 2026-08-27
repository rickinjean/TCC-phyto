import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../config";
import authFetch from "../authFetch";
import { decodeId } from "../idCodec";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' fill='%23dceee3'%3E%3Crect width='600' height='400'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%232f8a5d'%3E%F0%9F%8C%BF%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2371827a'%3ESem imagem%3C/text%3E%3C/svg%3E";

function ImgWithFallback({ src, alt, className }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => { setImgSrc(PLACEHOLDER_IMG); }}
    />
  );
}

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

function TaxonomyStep({ label, value }) {
  if (!value) return null;
  return (
    <>
      <span className="plant-details-taxonomy__step">
        <span className="plant-details-taxonomy__step-label">{label}</span>
        <span className="plant-details-taxonomy__step-value">{value}</span>
      </span>
      <span className="plant-details-taxonomy__arrow" aria-hidden="true">→</span>
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

export default function PlantDetails({ onFavChange }) {
  const [plant, setPlant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
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

        try {
          const favRes = await authFetch(`${API_URL}/favorites`);
          if (!cancelled && favRes && favRes.ok) {
            const favs = await favRes.json();
            setIsFavorite(favs.some(f => f.plantId === realId));
          }
        } catch { /* ignore */ }

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

  async function toggleFavorite() {
    try {
      if (isFavorite) {
        const res = await authFetch(`${API_URL}/favorites/${realId}`, { method: "DELETE" });
        if (res && res.ok) { setIsFavorite(false); onFavChange?.(); }
      } else {
        const res = await authFetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plantId: realId })
        });
        if (res && res.ok) { setIsFavorite(true); onFavChange?.(); }
      }
    } catch (err) {
      console.error("Erro ao atualizar favorito:", err);
    }
  }

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
            <button
              className={`plant-details-favorite-btn ${isFavorite ? "is-favorite" : ""}`}
              onClick={toggleFavorite}
              type="button"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="container plant-details-media-shell">

          {/* ── IMAGEM ── */}
          {hasAnyImage ? (
            hasImages ? (
              <div id="plantImagesCarousel" className="carousel slide plant-details-carousel mb-4" data-bs-ride="carousel">
                <div className="carousel-indicators">
                  {plant.imagesPath.map((_, i) => (
                    <button type="button" key={i} data-bs-target="#plantImagesCarousel"
                      data-bs-slide-to={i} className={i === 0 ? "active" : ""}
                      aria-current={i === 0 ? "true" : undefined} aria-label={`Imagem ${i + 1}`} />
                  ))}
                </div>
                <div className="carousel-inner plant-details-carousel-inner">
                  {plant.imagesPath.map((src, i) => (
                    <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={i}>
                      <ImgWithFallback src={`${API_URL}${src}`} alt={`${plant.name} ${i + 1}`} className="d-block w-100 plant-details-image" />
                    </div>
                  ))}
                </div>
                {plant.imagesPath.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target="#plantImagesCarousel" data-bs-slide="prev" aria-label="Imagem anterior">
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#plantImagesCarousel" data-bs-slide="next" aria-label="Próxima imagem">
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="plant-details-single-image mb-4">
                <ImgWithFallback src={`${API_URL}${plant.imagePath}`} alt={plant.name} className="plant-details-image plant-details-image--single" />
              </div>
            )
          ) : (
            <div className="plant-details-single-image mb-4">
              <img src={PLACEHOLDER_IMG} alt="Sem imagem disponível" className="plant-details-image plant-details-image--single" />
            </div>
          )}

          {/* ── DESCRIÇÃO ── */}
          {plant.description && (
            <section className="plant-details-description mb-4">
              <h2 className="plant-details-section-title">Descrição</h2>
              <p className="plant-details-description-text">{plant.description}</p>
            </section>
          )}

          {plant.simpleDescription && (
            <section className="plant-details-simple-desc mb-4">
              <h2 className="plant-details-section-title">Resumo Rápido</h2>
              <p className="plant-details-description-text">{plant.simpleDescription}</p>
            </section>
          )}

          {/* ── BADGES RÁPIDOS ── */}
          <div className="plant-details-quick-badges mb-4">
            <QuickBadge icon="🌱" label="Tipo" value={v("type")} />
            <QuickBadge icon="🌍" label="Origem" value={v("origin")} />
            <QuickBadge icon="⚠️" label="Toxicidade" value={v("toxicity")} />
            <QuickBadge icon="🎯" label="Dificuldade" value={v("dificulty")} />
          </div>
        </div>

        <div className="container plant-details-info-shell">

          {/* ── CARACTERÍSTICAS FÍSICAS ── */}
          <SectionCard title="Características Físicas" icon="🌿">
            <div className="plant-details-data-grid plant-details-data-grid--4">
              <InfoItem label="Altura" value={v("height")} />
              <InfoItem label="Cor da Flor" value={v("flowercolor")} />
              <InfoItem label="Folhagem" value={v("foliage")} />
              <InfoItem label="Floração" value={v("flowering")} />
              <InfoItem label="Tamanho" value={v("size")} />
              <InfoItem label="Fruto" value={v("fruit")} />
              <InfoItem label="Propagação" value={v("propagation")} />
            </div>
          </SectionCard>

          {/* ── NECESSIDADES AMBIENTAIS ── */}
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
            <div className="plant-details-data-grid plant-details-data-grid--4 mt-3">
              <InfoItem label="Horas de Sol" value={v("iluminosity")} />
              <InfoItem label="Tolerância" value={v("tolerance")} />
              <InfoItem label="Proteção Climática" value={v("protection")} />
            </div>
          </SectionCard>

          {/* ── CLASSIFICAÇÃO TAXONÔMICA ── */}
          <SectionCard title="Classificação Taxonômica" icon="🧬">
            <div className="plant-details-taxonomy">
              <TaxonomyStep label="Filo" value={v("Filo")} />
              <TaxonomyStep label="Classe" value={v("Classe")} />
              <TaxonomyStep label="Ordem" value={v("Ordem")} />
              <TaxonomyStep label="Família" value={v("Family")} />
              <TaxonomyStep label="Gênero" value={v("Genero")} />
              <TaxonomyStep label="Espécie" value={v("Especie")} />
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
                  <p className="plant-details-label">Fertilização</p>
                  <p className="plant-details-value">{v("fertilizing") || "—"}</p>
                  <p className="plant-details-label">Poda</p>
                  <p className="plant-details-value">{v("pruning") || "—"}</p>
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

          {/* ── ADUBAÇÃO ── */}
          <SectionCard title="Adubação" icon="🧪">
            <div className="plant-details-data-grid plant-details-data-grid--4">
              <InfoItem label="Frequência" value={v("frequency")} />
              <InfoItem label="Tipo NPK" value={v("NPK")} />
              <InfoItem label="Época" value={v("season")} />
              <InfoItem label="Ferramenta" value={v("tools")} />
            </div>
          </SectionCard>

          {/* ── PRAGAS E MONITORAMENTO ── */}
          <SectionCard title="Pragas e Monitoramento" icon="🐛">
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
      </main>
    </div>
  );
}
