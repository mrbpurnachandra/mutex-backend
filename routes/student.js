const express = require('express')
const asyncWrapper = require('../lib/asyncWrapper')
const studentSchema = require('../schemas/student')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const verified = require('../middlewares/verified')
const router = express.Router()

router.post(
    '/',
    auth,
    verified, 
    asyncWrapper(async (req, res, next) => {
        const user = req.user

        const { error, value: studentData } = studentSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        if (user.teacher || user.student)
            throw {
                message: 'user can either be student or teacher',
                status: 400,
            }

        const student = await prisma.student.create({
            data: {
                ...studentData,
                userId: user.id,
            },
        })
        res.status(201)
        res.json(student)
    })
)

module.exports = router
