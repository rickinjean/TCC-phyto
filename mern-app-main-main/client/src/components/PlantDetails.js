import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

function Pill({ icon, children }) {
  if (!children) return null;
  return (
    <span className="phyto-pill">
      <span className="phyto-pill__icon" aria-hidden="true">{icon}</span>
      <span className="phyto-pill__value">{children}</span>
    </span>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <h2 className="phyto-section-title">
      {icon && <span className="phyto-section-title__icon" aria-hidden="true">{icon}</span>}
      {children}
    </h2>
  );
}

function InfoItem({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <div className="phyto-data-item">
      <p className="phyto-data-item__label">{label}</p>
      <p className="phyto-data-item__value">{value}</p>
    </div>
  );
}

function OverviewCard({ icon, label, value }) {
  if (!value || value === "—") return null;
  return (
    <div className="phyto-overview-card">
      <span className="phyto-overview-card__icon" aria-hidden="true">{icon}</span>
      <span className="phyto-overview-card__label">{label}</span>
      <span className="phyto-overview-card__value">{value}</span>
    </div>
  );
}

function SunMeter({ score }) {
  const level = score || 0;
  return (
    <div className="phyto-sun-meter" aria-label={`Nível de luminosidade ${level} de 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`phyto-sun-meter__sun ${n <= level ? "is-on" : ""}`} aria-hidden="true">☀️</span>
      ))}
    </div>
  );
}

function WaterScale({ position, value }) {
  if (position == null) return null;
  return (
    <div className="phyto-water-scale">
      <div className="phyto-water-scale__labels">
        <span>Baixa</span>
        <span className="phyto-water-scale__value">{value}</span>
        <span>Alta</span>
      </div>
      <div className="phyto-water-scale__track">
        <span className="phyto-water-scale__fill" />
        <span className="phyto-water-scale__marker" style={{ left: `${position}%` }} />
      </div>
    </div>
  );
}

function TaxoNode({ label, value, isSpecies = false }) {
  if (!value) return null;
  return (
    <div className="phyto-taxo-node">
      <span className="phyto-taxo-node__label">{label}</span>
      <span className={`phyto-taxo-node__value ${isSpecies ? "is-species" : ""}`}>{value}</span>
    </div>
  );
}

function TaxoConnector() {
  return (
    <div className="phyto-taxo-connector" aria-hidden="true">
      <span className="phyto-taxo-connector__line" />
      <span className="phyto-taxo-connector__arrow">▼</span>
    </div>
  );
}

function CareCard({ icon, title, text, chips = [] }) {
  const hasText = !!(text && text !== "—");
  const visibleChips = chips.filter(c => c.value && c.value !== "—");
  if (!hasText && visibleChips.length === 0) return null;
  return (
    <div className="phyto-care-card">
      <header className="phyto-care-card__header">
        <span className="phyto-care-card__icon" aria-hidden="true">{icon}</span>
        <h3 className="phyto-care-card__title">{title}</h3>
      </header>
      {hasText && <p className="phyto-care-card__text">{text}</p>}
      {visibleChips.length > 0 && (
        <div className="phyto-care-card__chips">
          {visibleChips.map((c, i) => (
            <span className="phyto-chip" key={i}>
              <span className="phyto-chip__icon" aria-hidden="true">{c.icon}</span>
              <span className="phyto-chip__label">{c.label}</span>
              {c.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineStep({ icon, title, text, chip, chipLabel }) {
  return (
    <div className="phyto-timeline__step">
      <div className="phyto-timeline__node">
        <span className="phyto-timeline__icon" aria-hidden="true">{icon}</span>
        <div className="phyto-timeline__content">
          <span className="phyto-timeline__title">{title}</span>
          {text && <p className="phyto-timeline__text">{text}</p>}
          {chip && chip !== "—" && (
            <span className="phyto-chip mt-2">
              <span className="phyto-chip__icon" aria-hidden="true">↔️</span>
              <span className="phyto-chip__label">{chipLabel}</span>
              {chip}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineConnector() {
  return <div className="phyto-timeline__connector" aria-hidden="true" />;
}

function SkeletonLoader() {
  return (
    <div className="plant-details-skeleton">
      <div className="plant-details-skeleton__header skeleton-pulse" />
      <div className="container">
        <div className="plant-details-skeleton__image skeleton-pulse" />
        <div className="plant-details-skeleton__badges">
          {[1, 2, 3].map(i => <div key={i} className="plant-details-skeleton__badge skeleton-pulse" />)}
        </div>
        {[1, 2, 3].map(i => (
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

// Mapeamentos para os indicadores visuais (valores dos dicionários)
const SUN_BY_ILUMINOSITY = {
  "Até 3 horas": 1,
  "4-6 horas": 2,
  "6-8 horas": 3,
  "Mais de 8 horas": 4,
  "Luz indireta o dia todo": 3,
};
const SUN_BY_LIGHT = {
  "Sombra": 1,
  "Meia-sombra": 3,
  "Sol pleno": 5,
};
const WATER_POS = {
  "Baixa": 0,
  "Moderada": 50,
  "Alta": 100,
};

export default function PlantDetails({ onFavChange }) {
  const [plant, setPlant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();
  const realId = decodeId(id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setActiveIndex(0);
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
            setIsFavorite(favs.some(f => String(f.plantId) === realId));
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
  const total = hasImages ? plant.imagesPath.length : 0;

  const goPrev = () => setActiveIndex(a => (a - 1 + total) % total);
  const goNext = () => setActiveIndex(a => (a + 1) % total);

  // Indicadores visuais
  const sunScore = (() => {
    const a = SUN_BY_ILUMINOSITY[v("iluminosity")];
    const b = SUN_BY_LIGHT[v("light")];
    if (a && b) return Math.round((a + b) / 2);
    return a || b || null;
  })();
  const waterPosition = WATER_POS[v("water")] ?? null;

  const detalheTecnicoItems = [
    { label: "Tipo", value: v("type") },
    { label: "Altura", value: v("height") },
    { label: "Cor da Flor", value: v("flowercolor") },
    { label: "Folhagem", value: v("foliage") },
    { label: "Floração", value: v("flowering") },
    { label: "Tamanho", value: v("size") },
    { label: "Fruto", value: v("fruit") },
    { label: "Propagação", value: v("propagation") },
  ];
  const temDetalheTecnico = detalheTecnicoItems.some(i => i.value);

  const ambientalItems = [
    { label: "Horas de Sol", value: v("iluminosity"), icon: "☀️" },
    { label: "Tolerância", value: v("tolerance"), icon: "🛡️" },
    { label: "Temperatura", value: v("idealTemperature"), icon: "🌡️" },
    { label: "Proteção Climática", value: v("protection"), icon: "🌤️" },
  ].filter(i => i.value);

  const cultivoSteps = [];
  if (v("station")) cultivoSteps.push({ icon: "📅", title: "Estação de plantio", text: null, chip: v("station"), chipLabel: "Melhor época" });
  if (v("planting")) cultivoSteps.push({ icon: "🌱", title: "Plantio", text: v("planting"), chip: v("spacing"), chipLabel: "Espaçamento" });
  if (v("exhibition")) cultivoSteps.push({ icon: "☀️", title: "Exposição", text: v("exhibition"), chip: null, chipLabel: null });
  if (v("maintenance")) cultivoSteps.push({ icon: "🌿", title: "Manutenção", text: v("maintenance"), chip: null, chipLabel: null });

  const temLuminosidade = sunScore != null || v("light");
  const temAmbientais = temLuminosidade || waterPosition != null || ambientalItems.length > 0 || v("soil");

  return (
    <div className="plant-details-page">
      {/* ── HEADER ── */}
      <header className="plant-details-header">
        <div className="container plant-details-shell">
          <button className="btn plant-details-back" onClick={() => navigate(-1)} type="button">
            <span aria-hidden="true">←</span> Voltar
          </button>

          <nav className="plant-details-breadcrumb" aria-label="Trilha de navegação">
            <Link to="/plantlist">Catálogo</Link>
            <span className="plant-details-breadcrumb__sep" aria-hidden="true">/</span>
            {v("type") && <span className="plant-details-breadcrumb__type">{v("type")}</span>}
            <span className="plant-details-breadcrumb__sep" aria-hidden="true">/</span>
            <span className="plant-details-breadcrumb__current">{plant.name}</span>
          </nav>

          <div className="plant-details-header__title-row">
            <div>
              <h1 className="plant-details-title">{plant.name}</h1>
              {plant.scientificName && (
                <p className="plant-details-scientific-name">{plant.scientificName}</p>
              )}
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
        <div className="container plant-details-hero-shell">

          {/* ── HERO: FOTO + FICHA ── */}
          <div className="row g-4 g-lg-5 align-items-stretch">
            <div className="col-12 col-lg-7">
              {hasAnyImage ? (
                hasImages ? (
                  <>
                    <div className="plant-details-carousel">
                      <div className="plant-details-carousel-inner">
                        <ImgWithFallback
                          src={`${API_URL}${plant.imagesPath[activeIndex]}`}
                          alt={`${plant.name} ${activeIndex + 1}`}
                          className="plant-details-image"
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
                            <ImgWithFallback src={`${API_URL}${src}`} alt={`${plant.name} ${i + 1}`} className="plant-details-gallery__img" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="plant-details-carousel">
                    <div className="plant-details-carousel-inner">
                      <ImgWithFallback src={`${API_URL}${plant.imagePath}`} alt={plant.name} className="plant-details-image" />
                    </div>
                  </div>
                )
              ) : (
                <div className="plant-details-carousel">
                  <div className="plant-details-carousel-inner">
                    <img src={PLACEHOLDER_IMG} alt="Sem imagem disponível" className="plant-details-image" />
                  </div>
                </div>
              )}
            </div>

            <div className="col-12 col-lg-5">
              <aside className="plant-details-hero-aside">
                <div className="plant-details-pills">
                  <Pill icon="🌍">{v("origin")}</Pill>
                  <Pill icon="⚠️">{v("toxicity")}</Pill>
                  <Pill icon="🎯">{v("dificulty")}</Pill>
                </div>

                {plant.simpleDescription && (
                  <blockquote className="plant-details-quote">
                    <p>{plant.simpleDescription}</p>
                  </blockquote>
                )}
              </aside>
            </div>
          </div>
        </div>

        <div className="container plant-details-info-shell">

          {/* ── VISÃO GERAL ── */}
          <section className="phyto-section mb-5">
            <SectionTitle icon="👁️">Visão Geral</SectionTitle>
            <div className="phyto-overview-grid">
              <OverviewCard icon="📏" label="Altura" value={v("height")} />
              <OverviewCard icon="☀️" label="Luminosidade" value={v("light")} />
              <OverviewCard icon="💧" label="Água" value={v("water")} />
              <OverviewCard icon="🌡️" label="Temperatura" value={v("idealTemperature")} />
              <OverviewCard icon="🪴" label="Solo" value={v("soil")} />
              <OverviewCard icon="🌸" label="Floração" value={v("flowering")} />
            </div>
          </section>

          {/* ── SOBRE ── */}
          {plant.description && (
            <section className="phyto-section phyto-section--narrow mb-5">
              <SectionTitle icon="📖">Sobre a Planta</SectionTitle>
              <p className="phyto-description">{plant.description}</p>
            </section>
          )}

          {/* ── CARACTERÍSTICAS ── */}
          {temDetalheTecnico && (
            <section className="phyto-section mb-5">
              <SectionTitle icon="🌿">Características</SectionTitle>
              <div className="phyto-data-grid--3">
                {detalheTecnicoItems.map(item => (
                  <InfoItem key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </section>
          )}

          {/* ── NECESSIDADES AMBIENTAIS ── */}
          {temAmbientais && (
            <section className="phyto-section mb-5">
              <SectionTitle icon="☀️">Necessidades Ambientais</SectionTitle>

              {temLuminosidade && (
                <div className="phyto-meter">
                  <span className="phyto-meter__label">Luminosidade</span>
                  <SunMeter score={sunScore} />
                  <span className="phyto-meter__value">{v("light") || "—"}</span>
                  {v("iluminosity") && (
                    <span className="phyto-meter__hint">{v("iluminosity")}</span>
                  )}
                </div>
              )}

              {waterPosition != null && (
                <div className="phyto-meter">
                  <span className="phyto-meter__label">Necessidade de Água</span>
                  <WaterScale position={waterPosition} value={v("water")} />
                </div>
              )}

              {ambientalItems.length > 0 && (
                <div className="phyto-data-grid--2 mt-4">
                  {ambientalItems.map(item => (
                    <InfoItem key={item.label} label={`${item.icon} ${item.label}`} value={item.value} />
                  ))}
                </div>
              )}

              {v("soil") && (
                <div className="phyto-soil-row mt-3">
                  <span className="phyto-soil-row__icon" aria-hidden="true">🪴</span>
                  <span className="phyto-soil-row__label">Solo</span>
                  <span className="phyto-soil-row__value">{v("soil")}</span>
                </div>
              )}
            </section>
          )}

          {/* ── TAXONOMIA ── */}
          {(v("Filo") || v("Classe") || v("Ordem") || v("Family") || v("Genero") || v("Especie")) && (
            <section className="phyto-section mb-5">
              <SectionTitle icon="🧬">Classificação Taxonômica</SectionTitle>
              <div className="phyto-taxo">
                <TaxoNode label="Filo" value={v("Filo")} />
                {v("Filo") && <TaxoConnector />}
                <TaxoNode label="Classe" value={v("Classe")} />
                {v("Classe") && <TaxoConnector />}
                <TaxoNode label="Ordem" value={v("Ordem")} />
                {v("Ordem") && <TaxoConnector />}
                <TaxoNode label="Família" value={v("Family")} />
                {v("Family") && <TaxoConnector />}
                <TaxoNode label="Gênero" value={v("Genero")} />
                {v("Genero") && <TaxoConnector />}
                <TaxoNode label="Espécie" value={v("Especie")} isSpecies />
              </div>
            </section>
          )}

          {/* ── CUIDADOS ── */}
          {(v("watering") || v("pruning")) && (
            <section className="phyto-section mb-5">
              <SectionTitle icon="🤲">Cuidados da Planta</SectionTitle>
              <div className="row g-4">
                <div className="col-lg-6">
                  <CareCard
                    icon="💧"
                    title="Rega"
                    text={v("watering")}
                    chips={[
                      { icon: "🕐", label: "Horário ideal", value: v("manha") },
                      { icon: "💦", label: "Quantidade", value: v("amount") },
                    ]}
                  />
                </div>
                <div className="col-lg-6">
                  <CareCard
                    icon="✂️"
                    title="Poda"
                    text={v("pruning")}
                    chips={[
                      { icon: "📅", label: "Época", value: v("season") },
                      { icon: "🔧", label: "Ferramenta", value: v("tools") },
                    ]}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── CULTIVO ── */}
          {cultivoSteps.length > 0 && (
            <section className="phyto-section mb-5">
              <SectionTitle icon="🌱">Cultivo</SectionTitle>
              <div className="phyto-timeline">
                {cultivoSteps.map((step, i) => (
                  <div key={i}>
                    <TimelineStep {...step} />
                    {i < cultivoSteps.length - 1 && <TimelineConnector />}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── PRAGAS E MONITORAMENTO ── */}
          {(v("pests") || v("prevention") || v("monitoring")) && (
            <section className="phyto-section mb-5">
              <SectionTitle icon="🐛">Pragas e Monitoramento</SectionTitle>
              <div className="phyto-data-grid--3">
                <InfoItem label="⚠️ Pragas Comuns" value={v("pests")} />
                <InfoItem label="🛡️ Prevenção" value={v("prevention")} />
                <InfoItem label="📊 Monitoramento" value={v("monitoring")} />
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}