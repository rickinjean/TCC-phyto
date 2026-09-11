const mongodb = require("mongodb")
const dbo = require("./db/conn")

let imageBucket = null
let modelBucket = null

function getBucket() {
    if (!imageBucket) {
        imageBucket = new mongodb.GridFSBucket(dbo.getDb(), { bucketName: "images" })
    }
    return imageBucket
}

function getModelBucket() {
    if (!modelBucket) {
        modelBucket = new mongodb.GridFSBucket(dbo.getDb(), { bucketName: "models" })
    }
    return modelBucket
}

module.exports = { getBucket, getModelBucket }