const express = require('express')
const asyncWrapper = require('../lib/asyncWrapper')
const teacherSchema = require('../schemas/teacher')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const router = express.Router()

router.post(
    '/',
    auth,
    asyncWrapper(async (req, res, next) => {
        const user = req.user

        const { error, value: teacherData } = teacherSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        if (user.teacher || user.student)
            throw {
                message: 'user can either be student or teacher',
                status: 400,
            }

        const teacher = await prisma.teacher.create({
            data: {
                ...teacherData,
                userId: user.id,
            },
        })
        res.status(201)
        res.json(teacher)
    })
)

module.exports = router
