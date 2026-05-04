const express = require("express")
const plantRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId

/* ==================================================
   LISTAR TODAS AS PLANTAS
================================================== */
plantRoutes.route("/plant").get(async function (req, res) {
    const db_connect = dbo.getDb()

    try {
        const result = await db_connect
            .collection("plants")
            .find({})
            .toArray()

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   BUSCAR PLANTA POR ID
================================================== */
plantRoutes.route("/plant/:id").get(async function (req, res) {
    const db_connect = dbo.getDb()

    try {
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }

        const result = await db_connect
            .collection("plants")
            .findOne({ _id: new ObjectId(id) })

        if (!result) {
            return res.status(404).json({
                message: `Planta com id ${id} não encontrada`
            })
        }

        res.status(200).json(result)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   CRIAR PLANTA
================================================== */
plantRoutes.route("/plant/add").post(async function (req, res) {
    const db_connect = dbo.getDb()

    const myobj = {
        // Dados Básicos
        name: req.body.name,
        scientificName: req.body.scientificName,
        description: req.body.description,
        simpleDescription: req.body.simpleDescription,
        // Informações Botânicas
        fruit: req.body.fruit,
        origin: req.body.origin,
        type: req.body.type,
        propagation: req.body.propagation,
        toxicity: req.body.toxicity,
        dificulty: req.body.dificulty,
        // Classificação
        Filo: req.body.Filo,
        Classe: req.body.Classe,
        Ordem: req.body.Ordem,
        Family: req.body.Family,
        Gênero: req.body.Gênero,
        Espécie: req.body.Especie,
        // Características Físicas
        height: req.body.height,
        flowercolor: req.body.flowercolor,
        foliage: req.body.foliage,
        flowering: req.body.flowering,
        //Necessidades ambientais
        light: req.body.light,
        water: req.body.water,
        size: req.body.size,
        soil: req.body.soil,
        // Cuidados
        watering: req.body.watering,
        fertilizing: req.body.fertilizing,
        pruning: req.body.pruning,
        pests: req.body.pests,
            //Dicas de Cuidados
            manha: req.body.manha,
            amount: req.body.amount,
            frequency: req.body.frequency,
            NPK: req.body.NPK,
            season: req.body.season,
            tools: req.body.tools,
            prevention: req.body.prevention,
            monitoring: req.body.monitoring,
        // Cultivo
        planting: req.body.planting,
        exhibition: req.body.exhibition,
        maintenance: req.body.maintenance,
            // Dicas de Cultivo
            station: req.body.station,
            spacing: req.body.spacing,
            luminosity: req.body.luminosity,
            protection: req.body.protection,
            idealTemperature: req.body.idealTemperature,
            tolerance: req.body.tolerance,
    }

    try {
        const result = await db_connect
            .collection("plants")
            .insertOne(myobj)

        res.status(201).json(result)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   EDITAR PLANTA
================================================== */
plantRoutes.route("/plant/:id").put(async function (req, res) {
    const db_connect = dbo.getDb()

    try {
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID inválido"
            })
        }

        const myquery = { _id: new ObjectId(id) }

        const newvalues = {
            $set: {
               // Dados Básicos
        name: req.body.name,
        scientificName: req.body.scientificName,
        description: req.body.description,
        simpleDescription: req.body.simpleDescription,
        // Informações Botânicas
        fruit: req.body.fruit,
        origin: req.body.origin,
        type: req.body.type,
        propagation: req.body.propagation,
        toxicity: req.body.toxicity,
        dificulty: req.body.dificulty,
        // Classificação
        Filo: req.body.Filo,
        Classe: req.body.Classe,
        Ordem: req.body.Ordem,
        Family: req.body.Family,
        Gênero: req.body.Gênero,
        Espécie: req.body.Especie,
        // Características Físicas
        height: req.body.height,
        flowercolor: req.body.flowercolor,
        foliage: req.body.foliage,
        flowering: req.body.flowering,
        //Necessidades ambientais
        light: req.body.light,
        water: req.body.water,
        size: req.body.size,
        soil: req.body.soil,
        // Cuidados
        watering: req.body.watering,
        fertilizing: req.body.fertilizing,
        pruning: req.body.pruning,
        pests: req.body.pests,
            //Dicas de Cuidados
            manha: req.body.manha,
            amount: req.body.amount,
            frequency: req.body.frequency,
            NPK: req.body.NPK,
            season: req.body.season,
            tools: req.body.tools,
            prevention: req.body.prevention,
            monitoring: req.body.monitoring,
        // Cultivo
        planting: req.body.planting,
        exhibition: req.body.exhibition,
        maintenance: req.body.maintenance,
            // Dicas de Cultivo
            station: req.body.station,
            spacing: req.body.spacing,
            luminosity: req.body.luminosity,
            protection: req.body.protection,
            idealTemperature: req.body.idealTemperature,
            tolerance: req.body.tolerance,
            }
        }

        const result = await db_connect
            .collection("plants")
            .updateOne(myquery, newvalues)

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: `Planta com id ${id} não encontrada`
            })
        }

        res.status(200).json({
            message: "Planta atualizada com sucesso"
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   DELETAR PLANTA
================================================== */
plantRoutes.route("/plant/:id").delete(async function (req, res) {
    const db_connect = dbo.getDb()

    try {
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID inválido"
            })
        }

        const result = await db_connect
            .collection("plants")
            .deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Planta não encontrada"
            })
        }

        res.status(200).json({
            message: "Planta deletada com sucesso"
        })

    } catch (err) {
        res.status(500).json({
            message: "Erro ao deletar planta"
        })
    }
})

module.exports = plantRoutes
