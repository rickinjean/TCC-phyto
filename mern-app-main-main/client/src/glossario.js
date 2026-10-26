import { useEffect } from "react"
import API_URL from "./config"

const ignorarTags = new Set(["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT", "OPTION", "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"])

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function atualizarTooltip(element) {
    if (typeof window.tippy !== "function") return
    window.tippy(element, {
        content: element.dataset.tippyContent,
        trigger: "mouseenter focus click",
        interactive: true,
        appendTo: () => document.body,
        maxWidth: "min(320px, calc(100vw - 24px))",
        placement: "top",
        theme: "phyto",
        touch: true,
        boundary: "viewport",
        popperOptions: { modifiers: [{ name: "preventOverflow", options: { boundary: "viewport", padding: 12 } }, { name: "flip", options: { fallbackPlacements: ["bottom", "top"] } }] },
    })
}

function aplicarGlossario(root, regex, definicoes) {
    if (!regex || !root) return
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement
            if (!parent || ignorarTags.has(parent.tagName) || parent.closest(".termo-acessivel,[contenteditable='true'],[aria-hidden='true']")) return NodeFilter.FILTER_REJECT
            return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        },
    })
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
        const texto = node.nodeValue
        regex.lastIndex = 0
        let match
        let cursor = 0
        let changed = false
        const fragment = document.createDocumentFragment()
        while ((match = regex.exec(texto))) {
            const prefix = match[1]
            const matchedTerm = match[2]
            const start = match.index + prefix.length
            if (start > cursor) fragment.append(document.createTextNode(texto.slice(cursor, start)))
            const definicao = definicoes.get(matchedTerm.toLocaleLowerCase("pt-BR"))
            if (!definicao) continue
            const span = document.createElement("span")
            span.className = "termo-acessivel"
            span.tabIndex = 0
            span.setAttribute("role", "button")
            span.setAttribute("aria-label", `${matchedTerm}. Definição: ${definicao}`)
            span.dataset.tippyContent = definicao
            span.title = definicao
            span.textContent = matchedTerm
            fragment.append(span)
            cursor = start + matchedTerm.length
            changed = true
        }
        if (changed) {
            if (cursor < texto.length) fragment.append(document.createTextNode(texto.slice(cursor)))
            node.parentNode.replaceChild(fragment, node)
        }
    }
    root.querySelectorAll(".termo-acessivel").forEach((element) => { if (!element._tippy) atualizarTooltip(element) })
}

export default function GlossarioGlobal() {
    useEffect(() => {
        let active = true
        let regex = null
        let definicoes = new Map()
        const content = document.getElementById("conteudo")
        const processar = () => { if (active && regex) aplicarGlossario(content, regex, definicoes) }
        fetch(`${API_URL}/api/glossario`, { headers: { Accept: "application/json" } })
            .then((res) => res.ok ? res.json() : {})
            .then((data) => {
                if (!active || !data || typeof data !== "object") return
                const glossario = Object.entries(data).filter(([termo, definicao]) => termo.trim() && typeof definicao === "string" && definicao.trim()).map(([termo, definicao]) => ({ termo, definicao })).sort((a, b) => b.termo.length - a.termo.length)
                definicoes = new Map(glossario.map(({ termo, definicao }) => [termo.toLocaleLowerCase("pt-BR"), definicao]))
                regex = glossario.length ? new RegExp(`(^|[^\\p{L}\\p{N}_])(${glossario.map(({ termo }) => escapeRegex(termo)).join("|")})(?=$|[^\\p{L}\\p{N}_])`, "giu") : null
                processar()
            })
            .catch(() => {})
        const observer = new MutationObserver(processar)
        if (content) observer.observe(content, { childList: true, subtree: true })
        return () => { active = false; observer.disconnect() }
    }, [])
    return null
}
