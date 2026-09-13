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