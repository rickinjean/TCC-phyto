const express = require("express")
const statsRoutes = express.Router()
const dbo = require("../db/conn")
const { asyncHandler } = require("../utils")

statsRoutes.route("/stats").get(asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const [plantCount, userCount, messageCount, collectionItemCount] = await Promise.all([
        db_connect.collection("plants").countDocuments(),
        db_connect.collection("users").countDocuments(),
        db_connect.collection("messages").countDocuments().catch(() => 0),
        db_connect.collection("userlist_items").countDocuments().catch(() => 0),
    ])
    res.status(200).json({ plantCount, userCount, messageCount, collectionItemCount })
}))

module.exports = statsRoutes