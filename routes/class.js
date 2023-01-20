const express = require('express')
const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')
const auth = require('../middlewares/auth')
const student = require('../middlewares/student')
const classSchema = require('../schemas/class')
const router = express.Router()

router.use(auth, student)

router.post(
    '/',
    asyncWrapper(async (req, res, next) => {
        const user = req.user
        const student = req.student

        const { error, value: classData } = classSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        // TODO - if student is enrolled in one class he/she cannot be in other class
        const newClass = await prisma.class.create({
            data: { ...classData, crId: student.id },
        })

        res.status(201)
        res.json(newClass)
    })
)

module.exports = router
