const jwt = require("jsonwebtoken")
const logger = require("../logger")

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definida no ambiente. Configure server/.env antes de subir o servidor.")
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
if (!JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET não está definida no ambiente. Configure server/.env antes de subir o servidor.")
}
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "60m"
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d"

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ mensagem: "Token não enviado" })
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
    // Token inválido ou expirado = não autenticado (401). Semântica correta:
    // o cliente renova a sessão em 401; 403 fica reservado a "acesso negado".
    if (err) {
      return res.status(401).json({ mensagem: "Token inválido ou expirado" })
    }
    req.user = decoded
    next()
  })
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const tipo = req.user && req.user.tipo
    if (!tipo || !allowedRoles.includes(tipo)) {
      // Diagnóstico: ajuda a distinguir "token inválido/expirado" (401 na
      // authenticateToken) de "sem permissão" (403 aqui) em produção.
      logger.warn({ metodo: req.method, url: req.originalUrl, tipo }, "[auth] 403 Acesso negado")
      return res.status(403).json({ mensagem: "Acesso negado" })
    }
    next()
  }
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL })
}

function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded)
    })
  })
}

module.exports = { authenticateToken, authorizeRoles, signToken, signRefreshToken, verifyRefreshToken, REFRESH_TOKEN_TTL }
