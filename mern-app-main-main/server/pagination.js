const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 100

function positiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parsePagination(query = {}, options = {}) {
    const defaultLimit = options.defaultLimit || DEFAULT_LIMIT
    const maxLimit = options.maxLimit || MAX_LIMIT
    return {
        page: positiveInteger(query.page, DEFAULT_PAGE),
        limit: Math.min(positiveInteger(query.limit, defaultLimit), maxLimit),
    }
}

function paginationMetadata(page, limit, total) {
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const currentPage = Math.min(page, totalPages)
    return {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
    }
}

async function paginateFind(collection, filter, projection, query, options = {}) {
    const requested = parsePagination(query, options)
    const total = await collection.countDocuments(filter)
    const pagination = paginationMetadata(requested.page, requested.limit, total)
    const data = await collection.find(filter, { projection })
        .sort(options.sort || { _id: 1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .toArray()
    return { data, pagination }
}

module.exports = { DEFAULT_LIMIT, MAX_LIMIT, parsePagination, paginationMetadata, paginateFind }
