function handle(err) {
    console.log(err) // This error should be logged somewhere
    process.exit(1)
}

// Process Configuration
process.on('uncaughtException', handle)
process.on('unhandledRejection', handle)
require('dotenv').config()

require('./app').listen(3000, () => console.log('running...'))