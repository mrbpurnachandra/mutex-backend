const redisClient = require("../config/redis");

async function connect() {
    try {
        await redisClient.connect()
    } catch (e) {
        throw e
    }
}

module.exports = connect