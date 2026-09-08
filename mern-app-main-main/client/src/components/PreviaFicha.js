import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' fill='%23dceee3'%3E%3Crect width='600' height='400'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%232f8a5d'%3E%F0%9F%8C%BF%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2371827a'%3ESem imagem%3C/text%3E%3C/svg%3E"

const TAXO_LABEL = { Filo: "Filo", Classe: "Classe", Ordem: "Ordem", Family: "Família", Genero: "Gênero", Especie: "Espécie" }

function TaxoStep({ label, value, arrow }) {
  if (!value) return null
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
  )
}

function DentroFicha({ nome, scientificName, tipo, origem, descricao, taxonomia }) {
  const taxo = taxonomia || []
  return (
    <div className="preview-ficha">
      <div className="preview-ficha__header">
        <h2 className="plant-details-title mb-1">{nome || "Sem nome"}</h2>
        {scientificName && <p className="plant-details-scientific-name mb-0">{scientificName}</p>}
      </div>

      <div className="plant-details-carousel preview-ficha__img">
        <div className="plant-details-carousel-inner">
          <img src={PLACEHOLDER_IMG} alt="Sem imagem disponível" className="plant-details-image" />
        </div>
      </div>

      <div className="plant-details-quick-badges">
        {tipo && (
          <div className="plant-details-badge">
            <span className="plant-details-badge__icon">🌿</span>
            <span className="plant-details-badge__label">Tipo</span>
            <span className="plant-details-badge__value">{tipo}</span>
          </div>
        )}
        {origem && (
          <div className="plant-details-badge">
            <span className="plant-details-badge__icon">🌍</span>
            <span className="plant-details-badge__label">Origem</span>
            <span className="plant-details-badge__value">{origem}</span>
          </div>
        )}
      </div>

      {descricao && (
        <section className="plant-details-simple-desc preview-ficha__sobre">
          <h3 className="plant-details-section-title">Sobre a Planta</h3>
          <p className="plant-details-description-text">{descricao}</p>
        </section>
      )}

      {taxo.length > 0 && (
        <section className="preview-ficha__taxo">
          <h3 className="plant-details-section-title">Classificação Taxonômica</h3>
          <div className="plant-details-taxonomy">
            {taxo.map((t, i) => (
              <TaxoStep key={t.label} label={t.label} value={t.value} arrow={i < taxo.length - 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function PreviaFicha({ aberto, onFechar, sug }) {
  const plantaId = (sug && sug.plantaId) || null
  const [planta, setPlanta] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erroFicha, setErroFicha] = useState("")

  useEffect(() => {
    if (!aberto) return
    let cancelled = false
    setPlanta(null)
    setCarregando(true)
    setErroFicha("")

    async function load() {
      setCarregando(true)
      setErroFicha("")
      try {
        const [plantRes, colRes] = await Promise.all([
          fetch(`${API_URL}/plant/${plantaId}`),
          fetch(`${API_URL}/collections/all`),
        ])
        if (!cancelled && plantRes.ok) {
          const data = await plantRes.json()
          const all = colRes.ok ? await colRes.json() : {}
          const resolve = (field, col) => {
            const v = data && data[field]
            const list = all && all[col]
            return v && list ? (list.find(i => i._id === v)?.name || null) : null
          }
          const taxo = ["Filo", "Classe", "Ordem", "Family", "Genero", "Especie"]
            .filter(f => data && data[f])
            .map(f => ({ label: TAXO_LABEL[f] || f, value: data[f] }))
          setPlanta({
            name: data.name,
            scientificName: data.scientificName,
            simpleDescription: data.simpleDescription,
            description: data.description,
            type: resolve("type", "type"),
            origin: resolve("origin", "origin"),
            taxo,
          })
        } else if (!cancelled) {
          setErroFicha("Não foi possível carregar a ficha da planta.")
        }
      } catch {
        if (!cancelled) setErroFicha("Erro ao carregar a ficha da planta.")
      } finally {
        if (!cancelled) setCarregando(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [aberto, plantaId])

  if (!aberto) return null

  const nome = planta && planta.name
  const scientificName = planta && planta.scientificName
  const tipo = planta && planta.type
  const origem = planta && planta.origin
  const descricao = planta && (planta.description || planta.simpleDescription)
  const taxo = (planta && planta.taxo) || []

  return (
    <div className="preview-modal__overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Ficha da planta">
        <div className="preview-modal__header">
          <h4 className="preview-modal__title">🔍 Ficha da planta</h4>
          <button type="button" className="preview-modal__close" onClick={onFechar} aria-label="Fechar">×</button>
        </div>

        <div className="preview-modal__body">
          {carregando ? (
            <div className="text-center py-5 text-muted">Carregando ficha da planta...</div>
          ) : erroFicha ? (
            <div className="alert alert-danger mb-0">{erroFicha}</div>
          ) : (
            <>
              <DentroFicha nome={nome} scientificName={scientificName} tipo={tipo} origem={origem} descricao={descricao} taxonomia={taxo} />
              {sug && sug.texto && (
                <div className="preview-modal__correcao">
                  <div className="preview-modal__correcao-title">✏️ Correção sugerida{ sug.campo ? ` — ${sug.campo}` : "" }</div>
                  <p>{sug.texto}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="preview-modal__footer">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onFechar}>Fechar</button>
          {planta && sug && (
            <Link to={`/editplant/${sug.plantaId}`} className="btn btn-sm btn-success">Editar ficha</Link>
          )}
        </div>
      </div>
    </div>
  )
}