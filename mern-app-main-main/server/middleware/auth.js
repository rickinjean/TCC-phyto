const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production"

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ mensagem: "Token não enviado" })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
}

module.exports = { authenticateToken, authorizeRoles, signToken }
