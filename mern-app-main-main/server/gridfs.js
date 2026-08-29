const mongodb = require("mongodb")
const dbo = require("./db/conn")

let bucket = null

function getBucket() {
    if (!bucket) {
        bucket = new mongodb.GridFSBucket(dbo.getDb(), { bucketName: "images" })
    }
    return bucket
}

module.exports = { getBucket }