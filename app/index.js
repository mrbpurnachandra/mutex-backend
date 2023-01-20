const express = require('express')
const bodyParser = require('body-parser')
const errorHandler = require('../middlewares/errorHandler')
const asyncWrapper = require('../lib/asyncWrapper')
const userRouter = require('../routes/user')

const app = express()
const prisma = require('./db')
const authRouter = require('../routes/auth')
const teacherRouter = require('../routes/teacher')
const studentRouter = require('../routes/student')
const classRouter = require('../routes/class')
const enrollRouter = require('../routes/enroll')

app.use(bodyParser.json())

// TODO - Testing Route
app.get(
    '/',
    asyncWrapper(async (req, res, next) => {
        const userCount1 = await prisma.user.count()
        res.json({ userCount: userCount1 })
    })
)

app.use('/auth', authRouter)
app.use('/user', userRouter)
app.use('/class', classRouter)
app.use('/teacher', teacherRouter)
app.use('/student', studentRouter)
app.use('/enroll', enrollRouter)

app.use(errorHandler)

module.exports = app
