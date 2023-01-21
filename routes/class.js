const express = require('express')
const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')
const auth = require('../middlewares/auth')
const cr = require('../middlewares/cr')
const student = require('../middlewares/student')
const classSchema = require('../schemas/class')
const vcrSchema = require('../schemas/vcr')
const router = express.Router()

router.use(auth, student)

router.post(
    '/',
    asyncWrapper(async (req, res, next) => {
        const user = req.user
        const student = req.student

        if (student.enroll)
            throw { message: 'student can enroll in only one class' }

        const { error, value: classData } = classSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const newClass = await prisma.$transaction(async (tx) => {
            // Create a class
            const newClass = await prisma.class.create({
                data: { ...classData, crId: student.id, vcrId: student.id },
            })

            // Add enrollment
            await prisma.enroll.create({
                data: {
                    status: 'approved',
                    approvedAt: new Date(),
                    studentId: student.id,
                    classId: newClass.id,
                },
            })
            return newClass
        })

        res.status(201)
        res.json(newClass)
    })
)

// Cr can add new vcr
// Removing vcr is equivalent to setting vcr to cr himself
router.post(
    '/vcr',
    cr,
    asyncWrapper(async (req, res, next) => {
        const { error, value: vcrData } = vcrSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const vcrId = vcrData.vcrId
        const student = req.student
        const classId = student.crOf.id

        const vcr = await prisma.enroll.findFirst({
            where: {
                studentId: vcrId,
                classId,
                status: 'approved',
            },
        })

        if (!vcr) throw { message: 'no such student in a class', status: 404 }

        const updatedClass = await prisma.class.update({
            where: {
                id: classId,
            },
            data: {
                vcrId,
            },
        })

        res.json(updatedClass)
    })
)

module.exports = router
