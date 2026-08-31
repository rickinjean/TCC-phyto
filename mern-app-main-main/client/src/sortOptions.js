export default function sortPorNome(lista) {
    return lista.slice().sort((a, b) =>
        a.name.localeCompare(b.name, "pt", { sensitivity: "base", numeric: true })
    )
}