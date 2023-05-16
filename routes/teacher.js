const express = require('express')
const asyncWrapper = require('../lib/asyncWrapper')
const teacherSchema = require('../schemas/teacher')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const router = express.Router()

router.get(
    '/',
    auth,
    asyncWrapper(async (req, res, next) => {
        const searchString = req.query.search
        const teachers = await prisma.teacher.findMany({
            where: {
                user: {
                    name: {
                        contains: searchString,
                    },
                },
            },
            include: {
                user: true,
            },
        })

        res.json(teachers)
    })
)

router.get(
    '/user/:id',
    auth,
    asyncWrapper(async (req, res, next) => {
        const teacherUserId = Number(req.params.id)

        if (isNaN(teacherUserId)) throw { message: 'Bad Request', status: 400 }

        // Here we use redis

        const teacher = await prisma.teacher.findFirst({
            where: {
                userId: teacherUserId,
            },
            include: {
                user: true,
            },
        })

        if (!teacher) throw { message: 'teacher not found', status: 404 }

        res.json(teacher)
    })
)

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
