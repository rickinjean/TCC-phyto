export const STATUS_LABEL = {
    pendente: "Pendente",
    aprovada: "Em processo",
    rejeitada: "Rejeitada",
    concluida: "Concluída",
}

export const TIPO_LABEL = {
    nova: "Nova planta",
    correcao: "Correção",
}

export function formatarData(iso, comHora = false) {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
    })
}