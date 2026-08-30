const express = require("express")
const statsRoutes = express.Router()
const dbo = require("../db/conn")

statsRoutes.route("/stats").get(async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const [plantCount, userCount, messageCount, favoriteCount] = await Promise.all([
            db_connect.collection("plants").countDocuments(),
            db_connect.collection("users").countDocuments(),
            db_connect.collection("messages").countDocuments().catch(() => 0),
            db_connect.collection("favorites").countDocuments().catch(() => 0),
        ])
        res.status(200).json({ plantCount, userCount, messageCount, favoriteCount })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = statsRoutes
