const express = require('express')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const student = require('../middlewares/student')
const asyncWrapper = require('../lib/asyncWrapper')
const { normalMessageSchema } = require('../schemas/message')
const enrolled = require('../middlewares/enrolled')
const router = express.Router()

router.use(auth)

router.use(
    '/normal',
    student,
    enrolled,
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const classId = student.enroll.classId

        const { error, value: normalMessageData } =
            normalMessageSchema.validate(req.body)

        if (error) throw { message: error.message, status: 400 }

        const normalMessage = await prisma.message.create({
            data: {
                ...normalMessageData,
                classId,
                senderId: req.user.id,
            },
        })

        res.status(201)
        res.json(normalMessage)
    })
)

module.exports = router
