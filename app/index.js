const express = require('express')
const bodyParser = require('body-parser')
const errorHandler = require('../middlewares/errorHandler')

const app = express()
app.use(bodyParser.json())

app.get('/', (req, res, next) => {
    res.json({ message: 'Welcome to Mutex API' })
})

app.use(errorHandler)

module.exports = app
