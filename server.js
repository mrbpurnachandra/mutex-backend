function handle(err) {
    console.log(err)
    process.exit(1)
}

// Process Configuration
process.on('uncaughtException', handle)
process.on('unhandledRejection', handle)
require('dotenv').config()

const server = require('./app/httpServer')
const appServer = require('./app/appServer')

server.on('request', appServer)
require('./socket/socketServer')
require('./app/redisService')()

server.listen(3000, () => console.log('running'))
