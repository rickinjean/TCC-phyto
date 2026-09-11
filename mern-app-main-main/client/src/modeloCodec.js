import * as tf from "@tensorflow/tfjs"

// Serializa o dataset do classificador KNN (mapa label -> Tensor2D de
// embeddings) para um objeto JSON simples, pronto para armazenar/servir.
export async function serializarDataset(classifier) {
    const raw = classifier.getClassifierDataset()
    const dataset = {}
    for (const [label, tensor] of Object.entries(raw)) {
        dataset[label] = await tensor.array()
    }
    return dataset
}

// Restaura um dataset serializado dentro de um classificador KNN.
export function restaurarDataset(classifier, dataset) {
    const obj = {}
    for (const [label, data] of Object.entries(dataset)) {
        obj[label] = tf.tensor2d(data)
    }
    classifier.setClassifierDataset(obj)
}

// Monta o payload completo (classes + dataset) que o Treinador envia ao servidor.
export function montarPayloadKNN(classes, classifier) {
    return serializarDataset(classifier).then(function (dataset) {
        return { classes: classes, dataset: dataset }
    })
}

// Recorta e redimensiona um elemento (vídeo/imagem) para um canvas size x size
// usando o recorte central ao quadrado (mesma lógica do Teachable Machine).
export function recortarParaQuadrado(elemento, size) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const ctx = canvas.getContext("2d")
    const width = elemento.videoWidth || elemento.naturalWidth || elemento.width
    const height = elemento.videoHeight || elemento.naturalHeight || elemento.height
    const min = Math.min(width, height)
    const scale = size / min
    const scaledW = Math.ceil(width * scale)
    const scaledH = Math.ceil(height * scale)
    const dx = scaledW - size
    const dy = scaledH - size
    ctx.drawImage(elemento, Math.ceil(dx / 2) * -1, Math.ceil(dy / 2) * -1, scaledW, scaledH)
    return canvas
}

// Pré-processa um elemento para o modelo TM exportado: recorte central,
// batch [1, size, size, 3] e normalização para o intervalo [-1, 1].
export function capturarTensorTM(elemento, size) {
    return tf.tidy(function () {
        const canvas = recortarParaQuadrado(elemento, size)
        const pixels = tf.browser.fromPixels(canvas)
        return pixels.toFloat().div(tf.scalar(127)).sub(tf.scalar(1)).expandDims(0)
    })
}