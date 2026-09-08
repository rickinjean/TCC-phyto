// Abre a rota de impressão dos favoritos em uma nova aba.
// A impressão acontece na própria página da rota (script do bundle externo,
// compatível com o CSP do servidor), onde o usuário escolhe "Salvar como PDF".
export default function abrirImpressaoFavoritos() {
    const url = `${window.location.origin}/favoritos/imprimir`
    window.open(url, "_blank", "noopener")
}