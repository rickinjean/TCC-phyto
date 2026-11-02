import { useEffect, useState } from "react";
import FavoriteButton from "./FavoriteButton";
import ListaPicker from "./ListaPicker";
import MapaDistribuicao from "./MapaDistribuicao";
import PlantImage from "./PlantImage";
import { PLACEHOLDER_DETAIL } from "../placeholderImg";
import { imgVariantProps } from "../getImageVariants";
import { nomesDe } from "../distribuicao";
import API_URL from "../config";

function SectionCard({ title, children, className = "" }) {
  return (
    <section className={`plant-detail-card ${className}`}>
      {title && <h3 className="plant-detail-card__title">{title}</h3>}
      {children}
    </section>
  );
}

function Info({ label, value }) {
  if (value == null || value === "" || value === "—") return null;
  return <div className="plant-detail-info"><span>{label}</span><strong>{value}</strong></div>;
}

function TextInfo({ label, value }) {
  if (value == null || value === "" || value === "—") return null;
  return <div className="plant-detail-text-info"><h4>{label}</h4><p>{value}</p></div>;
}

function Taxonomy({ value }) {
  const ranks = [
    ["Filo", value("Filo")], ["Classe", value("Classe")], ["Ordem", value("Ordem")],
    ["Família", value("Family")], ["Gênero", value("Genero")], ["Espécie", value("Especie")],
  ].filter(([, name]) => name);
  if (!ranks.length) return null;
  return <ol className="plant-detail-taxonomy">{ranks.map(([rank, name]) => <li key={rank}><span>{rank}</span><strong>{name}</strong></li>)}</ol>;
}

function SectionHeading({ number, eyebrow, title }) {
  return <div className="plant-detail-heading"><span>{number}</span><div><p>{eyebrow}</p><h2>{title}</h2></div></div>;
}

export default function PlantDetailsLayout({
  plant, value, realId, canFavorite, colecoes, corColecao, textoColecoes,
  pickerAberto, setPickerAberto, distribuicao, temDistribuicao, activeIndex,
  setActiveIndex, goPrev, goNext, navigate,
}) {
  const images = plant.imagesPath || [];
  const hasGallery = images.length > 0;
  const hasAny = (...fields) => fields.some((field) => value(field));
  const sections = [
    { id: "cultivo", label: "Cultivo e cuidados", visible: hasAny("light", "water", "soil", "idealTemperature", "iluminosity", "tolerance", "protection", "watering", "manha", "amount", "pruning", "season", "tools", "planting", "station", "spacing", "exhibition", "maintenance", "fertilizing", "frequency", "NPK", "pests", "prevention", "monitoring") },
    { id: "caracteristicas", label: "Características", visible: hasAny("height", "flowercolor", "foliage", "flowering", "size", "fruit", "propagation") },
    { id: "distribuicao", label: "Distribuição", visible: true },
    { id: "taxonomia", label: "Taxonomia", visible: hasAny("Filo", "Classe", "Ordem", "Family", "Genero", "Especie") },
  ].filter(section => section.visible);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id);
  const sectionIds = sections.map(section => section.id).join("|");
  useEffect(() => {
    const nodes = sectionIds.split("|").filter(Boolean)
      .map(id => document.getElementById(id)).filter(Boolean);
    if (!nodes.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSectionId(visible[0].target.id);
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });

    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);
  const slideNumber = (id) => String(sections.findIndex(section => section.id === id) + 1).padStart(2, "0");

  return (
    <div className="plant-details-page plant-detail-redesign">
      <article className="container plant-detail-container">
        <button className="plant-detail-back" onClick={() => navigate(-1)} type="button">← <span>Voltar</span></button>

        <section className="plant-detail-hero" aria-labelledby="plant-detail-name">
          <div className="plant-detail-gallery-wrap">
            <div className="plant-details-carousel">
              <div className="plant-details-carousel-inner">
                {hasGallery ? (
                  <PlantImage src={`${API_URL}${images[activeIndex]}`} alt={`${plant.name}, imagem ${activeIndex + 1}`} className="plant-details-image" fallback={PLACEHOLDER_DETAIL} sizesAttr="(max-width: 900px) 100vw, 52vw" {...imgVariantProps(plant.imagesMeta, images[activeIndex], API_URL)} />
                ) : plant.imagePath ? (
                  <PlantImage src={`${API_URL}${plant.imagePath}`} alt={plant.name} className="plant-details-image" fallback={PLACEHOLDER_DETAIL} sizesAttr="(max-width: 900px) 100vw, 52vw" {...imgVariantProps(plant.imagesMeta, plant.imagePath, API_URL)} />
                ) : <img src={PLACEHOLDER_DETAIL} alt="Sem imagem disponível" className="plant-details-image" />}
              </div>
              {hasGallery && images.length > 1 && <>
                <button className="plant-details-carousel__arrow is-prev" type="button" onClick={goPrev} aria-label="Imagem anterior">‹</button>
                <button className="plant-details-carousel__arrow is-next" type="button" onClick={goNext} aria-label="Próxima imagem">›</button>
              </>}
            </div>
            {hasGallery && images.length > 1 && <div className="plant-details-gallery" role="group" aria-label={`Galeria de imagens de ${plant.name}`}>
              {images.map((src, index) => <button key={src} type="button" className={`plant-details-gallery__thumb ${index === activeIndex ? "is-active" : ""}`} onClick={() => setActiveIndex(index)} aria-label={`Ver imagem ${index + 1}`} aria-pressed={index === activeIndex}>
                <PlantImage src={`${API_URL}${src}`} alt="" className="plant-details-gallery__img" fallback={PLACEHOLDER_DETAIL} sizesAttr="64px" {...imgVariantProps(plant.imagesMeta, src, API_URL)} />
              </button>)}
            </div>}
          </div>

          <div className="plant-detail-identity">
            <p className="plant-detail-eyebrow">Ficha botânica</p>
            <h1 id="plant-detail-name">{plant.name}</h1>
            {plant.scientificName && <p className="plant-detail-scientific">{plant.scientificName}</p>}
            <div className="plant-detail-tags">
              {[["Tipo", value("type")], ["Origem", value("origin")], ["Toxicidade", value("toxicity")], ["Dificuldade", value("dificulty")]].filter(([, v]) => v).map(([label, v]) => <span key={label}><small>{label}</small>{v}</span>)}
            </div>
            {plant.description && <div className="plant-detail-description"><h2>Sobre a planta</h2><p>{plant.description}</p></div>}
            {canFavorite && <FavoriteButton variant="details" corColecao={corColecao} qtdColecoes={colecoes.length} texto={textoColecoes} onClick={() => setPickerAberto(true)} />}
          </div>
        </section>

        <nav className="plant-detail-nav" aria-label="Seções da ficha">
          {sections.map(section => <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={activeSectionId === section.id ? "location" : undefined}
            className={activeSectionId === section.id ? "is-active" : ""}
            onClick={event => {
              event.preventDefault();
              setActiveSectionId(section.id);
              document.getElementById(section.id)?.scrollIntoView({ block: "start" });
              window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${section.id}`);
            }}
          >{section.label}</a>)}
        </nav>

        <div className="plant-detail-sections">
        {hasAny("light", "water", "soil", "idealTemperature", "iluminosity", "tolerance", "protection", "watering", "manha", "amount", "pruning", "season", "tools", "planting", "station", "spacing", "exhibition", "maintenance", "fertilizing", "frequency", "NPK", "pests", "prevention", "monitoring") && <section className="plant-detail-section" id="cultivo">
          <SectionHeading number={slideNumber("cultivo")} eyebrow="Guia de cultivo" title="Cultivo e cuidados" />
          <div className="plant-detail-grid plant-detail-grid--two">
            {hasAny("light", "water", "soil", "idealTemperature", "iluminosity", "tolerance", "protection") && <SectionCard title="Ambiente">
              <div className="plant-detail-info-grid">
                <Info label="Luz" value={value("light")} /><Info label="Água" value={value("water")} /><Info label="Solo" value={value("soil")} /><Info label="Temperatura" value={value("idealTemperature")} />
                <Info label="Horas de sol" value={value("iluminosity")} /><Info label="Tolerância" value={value("tolerance")} /><Info label="Proteção climática" value={value("protection")} />
              </div>
            </SectionCard>}
            {hasAny("watering", "manha", "amount", "pruning", "season", "tools") && <SectionCard title="Rega e poda">
              <div className="plant-detail-text-grid"><TextInfo label="Rega" value={value("watering")} /><TextInfo label="Horário ideal" value={value("manha")} /><TextInfo label="Quantidade" value={value("amount")} /><TextInfo label="Poda" value={value("pruning")} /><TextInfo label="Época de poda" value={value("season")} /><TextInfo label="Ferramenta" value={value("tools")} /></div>
            </SectionCard>}
            {hasAny("planting", "station", "spacing", "exhibition", "maintenance") && <SectionCard title="Plantio e manutenção">
              <div className="plant-detail-text-grid"><TextInfo label="Plantio" value={value("planting")} /><TextInfo label="Estação" value={value("station")} /><TextInfo label="Espaçamento" value={value("spacing")} /><TextInfo label="Exposição" value={value("exhibition")} /><TextInfo label="Manutenção" value={value("maintenance")} /></div>
            </SectionCard>}
            {hasAny("fertilizing", "frequency", "NPK", "pests", "prevention", "monitoring") && <SectionCard title="Adubação e saúde">
              <div className="plant-detail-text-grid"><TextInfo label="Adubação" value={value("fertilizing")} /><TextInfo label="Frequência" value={value("frequency")} /><TextInfo label="Tipo de NPK" value={value("NPK")} /><TextInfo label="Pragas comuns" value={value("pests")} /><TextInfo label="Prevenção" value={value("prevention")} /><TextInfo label="Monitoramento" value={value("monitoring")} /></div>
            </SectionCard>}
          </div>
        </section>}

        {hasAny("height", "flowercolor", "foliage", "flowering", "size", "fruit", "propagation") && <section className="plant-detail-section" id="caracteristicas">
          <SectionHeading number={slideNumber("caracteristicas")} eyebrow="Identificação" title="Características físicas" />
          <SectionCard title="Aspectos da planta">
            <div className="plant-detail-info-grid plant-detail-info-grid--four"><Info label="Altura" value={value("height")} /><Info label="Cor da flor" value={value("flowercolor")} /><Info label="Folhagem" value={value("foliage")} /><Info label="Floração" value={value("flowering")} /><Info label="Tamanho" value={value("size")} /><Info label="Fruto" value={value("fruit")} /><Info label="Propagação" value={value("propagation")} /></div>
          </SectionCard>
        </section>}

        <section className="plant-detail-section" id="distribuicao">
          <SectionHeading number={slideNumber("distribuicao")} eyebrow="Onde ocorre" title="Distribuição geográfica" />
          <SectionCard>
            {temDistribuicao ? <>
              <MapaDistribuicao nativa={distribuicao.nativa} cultivada={distribuicao.cultivada} />
              <div className="plant-dist-meta"><p className="plant-dist-resumo"><strong>{distribuicao.nativa.length}</strong> {distribuicao.nativa.length === 1 ? "país nativo" : "países nativos"} · <strong>{distribuicao.cultivada.length}</strong> {distribuicao.cultivada.length === 1 ? "país cultivado/introduzido" : "países cultivados/introduzidos"}</p>{distribuicao.fonte && <p className="plant-dist-fonte">Fonte: {distribuicao.fonte}</p>}</div>
              <details className="plant-dist-listas"><summary>Ver lista de países</summary><p><strong>Nativa:</strong> {nomesDe(distribuicao.nativa).join(", ") || "—"}</p><p><strong>Cultivada / introduzida:</strong> {nomesDe(distribuicao.cultivada).join(", ") || "—"}</p></details>
            </> : <p className="plant-dist-empty">Distribuição geográfica não registrada para esta amostra.</p>}
          </SectionCard>
        </section>

        {hasAny("Filo", "Classe", "Ordem", "Family", "Genero", "Especie") && <section className="plant-detail-section" id="taxonomia">
          <SectionHeading number={slideNumber("taxonomia")} eyebrow="Classificação científica" title="Taxonomia" />
          <SectionCard title="Classificação taxonômica"><Taxonomy value={value} /></SectionCard>
        </section>}
          </div>
      </article>
      {canFavorite && <ListaPicker aberto={pickerAberto} plantaId={realId} plantaNome={plant.name} onFechar={() => setPickerAberto(false)} />}
    </div>
  );
}
