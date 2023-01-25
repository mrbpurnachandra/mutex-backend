const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const errorHandler = require('../middlewares/errorHandler')
const asyncWrapper = require('../lib/asyncWrapper')

const app = express()
const prisma = require('./db')
const userRouter = require('../routes/user')
const authRouter = require('../routes/auth')
const teacherRouter = require('../routes/teacher')
const studentRouter = require('../routes/student')
const classRouter = require('../routes/class')
const enrollRouter = require('../routes/enroll')
const lectureRouter = require('../routes/lecture')
const announcementRouter = require('../routes/announcement')
const messageRouter = require('../routes/message')

app.use(bodyParser.json())
app.use(cors()) 

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
app.use('/lecture', lectureRouter)
app.use('/announcement', announcementRouter)
app.use('/message', messageRouter)

app.use(errorHandler)

module.exports = app
