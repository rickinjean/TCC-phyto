const pino = require("pino")

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER

const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", "*.senha", "*.password", "*.token"],
        censor: "[redacted]",
    },
    transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
})

module.exports = logger