const express = require("express")
const statsRoutes = express.Router()
const dbo = require("../db/conn")
const { asyncHandler } = require("../utils")

statsRoutes.route("/stats").get(asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const [plantCount, userCount, messageCount, collectionItemCount, familyCount] = await Promise.all([
        db_connect.collection("plants").countDocuments(),
        db_connect.collection("users").countDocuments(),
        db_connect.collection("messages").countDocuments().catch(() => 0),
        db_connect.collection("userlist_items").countDocuments().catch(() => 0),
        db_connect.collection("plants").distinct("Family").catch(() => []),
    ])
    res.status(200).json({
        plantCount,
        userCount,
        messageCount,
        collectionItemCount,
        familyCount: Array.isArray(familyCount) ? familyCount.filter(Boolean).length : 0,
    })
}))

module.exports = statsRoutes