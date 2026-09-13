const mongodb = require("mongodb")
const dbo = require("./db/conn")

let imageBucket = null

function getBucket() {
    if (!imageBucket) {
        imageBucket = new mongodb.GridFSBucket(dbo.getDb(), { bucketName: "images" })
    }
    return imageBucket
}

module.exports = { getBucket }