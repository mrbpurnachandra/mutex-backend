const express = require('express')
const bodyParser = require('body-parser')
const errorHandler = require('../middlewares/errorHandler')
const asyncWrapper = require('../lib/asyncWrapper')
const userRouter = require('../routes/user')

const app = express()
const prisma = require('./db')

app.use(bodyParser.json())

// TODO - Testing Route
app.get(
    '/',
    asyncWrapper(async (req, res, next) => {
        const userCount1 = await prisma.user.count()
        res.json({ userCount: userCount1 })
    })
)

app.use('/user', userRouter)

app.use(errorHandler)

module.exports = app
