import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../config";
import { decodeId } from "../idCodec";
import usePageTitle from "../usePageTitle";
import useColecoes from "../useColecoes";
import mapeamentoColecoes from "../mapeamentoColecoes";
import PlantDetailsLayout from "./PlantDetailsLayout";
import { distribuicaoDaPlanta } from "../distribuicao";

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

// Mapa campo → coleção derivado do módulo compartilhado (mapeamentoColecoes),
// evitando duplicar a lista de coleções aqui.
const COLLECTION_MAP = Object.fromEntries(
  Object.entries(mapeamentoColecoes).map(([field, meta]) => [field, meta.colecao])
);

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
  const navigate = useNavigate();
  const realId = decodeId(id);
  const { listasDe, corDaPlanta, textoDe } = useColecoes({
    plantaId: realId,
    ativo: canFavorite,
    refreshKey: pickerAberto,
  });

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

  // Cor do coração = cor da coleção mais recente que contém esta planta;
  // os valores vêm do hook useColecoes, que reexecuta ao abrir/fechar o picker.

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

  const total = plant.imagesPath?.length || 0;
  const distribuicao = distribuicaoDaPlanta(plant);
  const temDistribuicao = distribuicao.nativa.length > 0 || distribuicao.cultivada.length > 0;
  const colecoes = canFavorite ? listasDe(realId) : [];
  const corColecao = canFavorite ? corDaPlanta(realId) : null;
  const textoColecoes = canFavorite ? textoDe(realId) : "Adicionar a uma coleção";

  const goPrev = () => setActiveIndex(a => (a - 1 + total) % total);
  const goNext = () => setActiveIndex(a => (a + 1) % total);

  return <PlantDetailsLayout plant={plant} value={v} realId={realId} canFavorite={canFavorite} colecoes={colecoes} corColecao={corColecao} textoColecoes={textoColecoes} pickerAberto={pickerAberto} setPickerAberto={setPickerAberto} distribuicao={distribuicao} temDistribuicao={temDistribuicao} activeIndex={activeIndex} setActiveIndex={setActiveIndex} goPrev={goPrev} goNext={goNext} navigate={navigate} />;
}
