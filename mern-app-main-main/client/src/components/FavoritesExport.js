import API_URL from "../config"

function escapeHtml(str) {
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

function melhorImagemParaImpressao(plant) {
    const path = plant.imagesPath?.length > 0 ? plant.imagesPath[0] : plant.imagePath || null
    if (!path) return null
    const meta = (Array.isArray(plant.imagesMeta) ? plant.imagesMeta : []).find(m => m && (
        m.path === path || m.webpPath === path
    ))
    const sizes = meta?.sizes || {}
    const url = sizes["800"]?.webp || sizes["400"]?.webp || meta?.webpPath || meta?.path || path
    return `${API_URL}${url}`
}

function cardHtml(fav) {
    const plant = fav.plant
    const img = melhorImagemParaImpressao(plant)
    const data = fav.createdAt
        ? new Date(fav.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : ""

    const imagem = img
        ? `<div class="card__img"><img src="${escapeHtml(img)}" alt="Foto de ${escapeHtml(plant.name)}" decoding="async" onerror="this.style.display='none'"></div>`
        : `<div class="card__img"><span class="card__noimg">🌿</span></div>`

    return `
        <div class="card">
            ${imagem}
            <div class="card__body">
                <div class="card__name">${escapeHtml(plant.name)}</div>
                ${plant.scientificName ? `<div class="card__sci">${escapeHtml(plant.scientificName)}</div>` : ""}
                ${plant.simpleDescription ? `<div class="card__desc">${escapeHtml(plant.simpleDescription)}</div>` : ""}
                ${data ? `<div class="card__date">Adicionada em ${escapeHtml(data)}</div>` : ""}
            </div>
        </div>`
}

function montarHtml(favorites) {
    const total = favorites.length
    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric"
    })
    const contagem = total === 1 ? "1 planta favorita" : `${total} plantas favoritas`

    const cards = favorites.map(cardHtml).join("\n")

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Minhas Plantas Favoritas — Phytografia</title>
<style>
    :root { --cor-primaria: #2f8a5d; }
    * { box-sizing: border-box; }
    body {
        margin: 0;
        font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
        background: #f4f7f5;
        color: #1b2a23;
    }
    .page { max-width: 900px; margin: 0 auto; padding: 24px; }
    .page__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        border-bottom: 3px solid var(--cor-primaria);
        padding-bottom: 12px;
    }
    .page__brand { font-size: 14px; font-weight: 700; color: var(--cor-primaria); letter-spacing: .3px; }
    .page__header h1 { margin: 6px 0 0; font-size: 24px; }
    .page__meta { font-size: 12px; color: #5d6b63; text-align: right; }
    .page__count { margin: 14px 0; font-size: 13px; color: #5d6b63; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
    .card {
        border: 1px solid #e0e7e2;
        border-radius: 10px;
        background: #fff;
        overflow: hidden;
        break-inside: avoid;
        page-break-inside: avoid;
    }
    .card__img {
        aspect-ratio: 4 / 3;
        background: #e8f1ec;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 42px;
    }
    .card__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .card__noimg { color: var(--cor-primaria); opacity: .5; }
    .card__body { padding: 10px 12px 12px; }
    .card__name { font-size: 15px; font-weight: 700; color: #1b2a23; }
    .card__sci { font-size: 12px; font-style: italic; color: #4a5a52; margin-top: 2px; }
    .card__desc { font-size: 12px; color: #3c4c44; margin-top: 6px; line-height: 1.45; }
    .card__date { font-size: 11px; color: #8a9a90; margin-top: 8px; }
    .page__footer {
        margin-top: 24px;
        padding-top: 10px;
        border-top: 1px solid #e0e7e2;
        font-size: 11px;
        color: #8a9a90;
        text-align: center;
    }
    .print-btn {
        position: fixed;
        right: 16px;
        bottom: 16px;
        background: var(--cor-primaria);
        color: #fff;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .2);
    }
    @page { margin: 12mm 10mm; }
    @media print {
        body { background: #fff; }
        .page { max-width: 100%; padding: 0; }
        .print-btn { display: none; }
        .page__footer { margin-top: 20px; }
    }
</style>
</head>
<body>
    <div class="page">
        <header class="page__header">
            <div>
                <div class="page__brand">🌿 Phytografia</div>
                <h1>Minhas Plantas Favoritas</h1>
            </div>
            <div class="page__meta">Gerado em ${escapeHtml(dataGeracao)}</div>
        </header>
        <p class="page__count">${escapeHtml(contagem)}</p>
        <main class="grid">
            ${cards}
        </main>
        <footer class="page__footer">Phytografia — catálogo de plantas. Página gerada no navegador para impressão.</footer>
    </div>
    <button type="button" class="print-btn" onclick="window.print()">Imprimir / Salvar como PDF</button>
    <script>
        window.addEventListener('load', function () {
            setTimeout(function () {
                try { window.focus(); window.print(); } catch (e) {}
            }, 400)
        })
    </script>
</body>
</html>`
}

export default function abrirImpressaoFavoritos(favorites) {
    const validos = (favorites || []).filter(f => f && f.plant)
    if (validos.length === 0) return

    const win = window.open("", "_blank", "width=960,height=720")
    if (!win) {
        window.alert("Permita pop-ups para abrir a página de impressão.")
        return
    }
    win.document.open()
    win.document.write(montarHtml(validos))
    win.document.close()
    win.focus()
}