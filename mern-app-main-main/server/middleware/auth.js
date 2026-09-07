const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definida no ambiente. Configure server/.env antes de subir o servidor.")
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m"
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d"

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ mensagem: "Token não enviado" })
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
    if (err) {
      return res.status(403).json({ mensagem: "Token inválido" })
    }
    req.user = decoded
    next()
  })
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.tipo)) {
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
