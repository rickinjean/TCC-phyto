const test = require("node:test")
const assert = require("node:assert/strict")
const { parsePagination, paginationMetadata, paginateFind } = require("../pagination")

test("normaliza parâmetros de paginação e limita o tamanho pedido", () => {
    assert.deepEqual(parsePagination({ page: "3", limit: "500" }), { page: 3, limit: 100 })
    assert.deepEqual(parsePagination({ page: "0", limit: "-4" }), { page: 1, limit: 24 })
    assert.deepEqual(parsePagination({}), { page: 1, limit: 24 })
})

test("metadados mantêm pelo menos uma página e indicam navegação", () => {
    assert.deepEqual(paginationMetadata(1, 20, 45), {
        page: 1, limit: 20, total: 45, totalPages: 3,
        hasPreviousPage: false, hasNextPage: true,
    })
    assert.equal(paginationMetadata(9, 20, 45).page, 3)
    assert.equal(paginationMetadata(1, 20, 0).totalPages, 1)
})

test("consulta Mongo aplica skip e limit e devolve dados e metadados", async () => {
    const calls = {}
    const documents = Array.from({ length: 55 }, (_, index) => ({ id: index + 1 }))
    const collection = {
        async countDocuments(filter) { calls.filter = filter; return documents.length },
        find(filter, options) {
            calls.projection = options.projection
            const cursor = {
                sort(value) { calls.sort = value; return cursor },
                skip(value) { calls.skip = value; return cursor },
                limit(value) { calls.limit = value; return cursor },
                async toArray() { return documents.slice(calls.skip, calls.skip + calls.limit) },
            }
            return cursor
        },
    }

    const result = await paginateFind(collection, { origin: "native" }, { name: 1 }, { page: "2", limit: "20" }, { sort: { name: 1 } })
    assert.equal(result.data.length, 20)
    assert.equal(result.data[0].id, 21)
    assert.equal(calls.skip, 20)
    assert.equal(calls.limit, 20)
    assert.deepEqual(calls.filter, { origin: "native" })
    assert.deepEqual(result.pagination, {
        page: 2, limit: 20, total: 55, totalPages: 3,
        hasPreviousPage: true, hasNextPage: true,
    })
})
