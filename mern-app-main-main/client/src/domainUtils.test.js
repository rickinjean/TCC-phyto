import { encodeId, decodeId } from "./idCodec"
import { normalizarCodigos, distribuicaoDaPlanta, nomeDoPais, buscarPaises } from "./distribuicao"
import normalizeText from "./normalizeText"

describe("codificação de identificadores", () => {
    test("preserva um ObjectId hexadecimal de 24 caracteres no ciclo de codificação", () => {
        const id = "64a1b2c3d4e5f678901234ab"
        expect(decodeId(encodeId(id))).toBe(id)
    })

    test("mantém entrada vazia e deixa códigos inválidos legíveis", () => {
        expect(encodeId("")).toBe("")
        expect(decodeId("")).toBe("")
        expect(decodeId("valor!invalido")).toBe("valor!invalido")
    })
})

describe("distribuição geográfica", () => {
    test("normaliza códigos e remove valores malformados ou repetidos", () => {
        expect(normalizarCodigos([" bra ", "BRA", "arg", null, "BR", 10])).toEqual(["BRA", "ARG"])
    })

    test("lê dados ausentes como listas vazias e resolve nomes conhecidos", () => {
        expect(distribuicaoDaPlanta(null)).toEqual({ nativa: [], cultivada: [], fonte: "" })
        expect(distribuicaoDaPlanta({ distribuicao: { nativa: ["bra"], fonte: "  fonte  " } }))
            .toEqual({ nativa: ["BRA"], cultivada: [], fonte: "fonte" })
        expect(nomeDoPais("BRA")).toBe("Brasil")
    })

    test("busca país ignorando acentos e exige ao menos dois caracteres", () => {
        expect(buscarPaises("brasi").some(pais => pais.codigo === "BRA")).toBe(true)
        expect(buscarPaises("a")).toEqual([])
    })
})

test("normalização textual ignora caixa e acentos", () => {
    expect(normalizeText("Árvore Ipê")).toBe("arvore ipe")
})
