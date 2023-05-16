const Redis = require('redis')

let options

if (process.env.REDIS_URL) {
    options = { url: process.env.REDIS_URL }
}

const redisClient = Redis.createClient(options)

module.exports = redisClient
