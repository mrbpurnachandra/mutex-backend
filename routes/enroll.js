const express = require('express')
const auth = require('../middlewares/auth')
const student = require('../middlewares/student')
const cr = require('../middlewares/cr')
const asyncWrapper = require('../lib/asyncWrapper')
const enrollSchema = require('../schemas/enroll')
const prisma = require('../app/db')
const io = require('../socket/socketServer')

const router = express.Router()

router.use(auth, student)

router.get(
    '/',
    cr,
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const classId = student.crOf.id

        const enrolls = await prisma.enroll.findMany({
            where: {
                classId,
            },
            include: {
                student: {
                    include: {
                        user: true,
                        crOf: true,
                        vcrOf: true,
                    },
                },
            },
        })

        res.json(enrolls)
    })
)

// Any student not enrolled in other class can make enrollment which will be pending by default
router.post(
    '/',
    asyncWrapper(async (req, res, next) => {
        const { error, value: enrollData } = enrollSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const classId = enrollData.classId
        const student = req.student

        if (student.enroll)
            throw {
                message: 'student can enroll in only one class',
                status: 400,
            }

        const _class = await prisma.class.findFirst({
            where: {
                id: classId,
            },
        })

        if (!_class) throw { message: "class doesn't exist", status: 400 }
        const enroll = await prisma.enroll.create({
            data: {
                classId,
                studentId: student.id,
                status: 'pending',
            },
        })

        res.status(201)
        res.json(enroll)
    })
)

// Cr can only approve enrollments
router.post(
    '/:id/approve',
    cr,
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const enrollId = Number(req.params.id)

        const enroll = await prisma.enroll.findFirst({
            where: {
                id: enrollId,
                classId: student.crOf.id,
            },
        })

        if (!enroll) throw { message: 'no such enroll', status: 404 }
        if (enroll && enroll.approvedAt)
            throw { message: 'already approved', status: 400 }

        const updatedEnroll = await prisma.enroll.update({
            where: {
                id: enrollId,
            },

            data: {
                status: 'approved',
                approvedAt: new Date(),
            },
        })

        res.json(updatedEnroll)
    })
)

// Normal student can also cancel his enrollment request
router.post(
    '/:id/cancel',
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const enrollId = Number(req.params.id)

        const enroll = await prisma.enroll.findFirst({
            where: {
                id: enrollId,
                studentId: student.id,
                approvedAt: null,
            },
        })

        if (!enroll) throw { message: 'no such enroll', status: 400 }

        const deletedEnroll = await prisma.enroll.delete({
            where: {
                id: enrollId,
            },
        })

        res.json(deletedEnroll)
    })
)

// Cr can delete enrollment (either approved or not)
router.delete(
    '/:id',
    cr,
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const enrollId = Number(req.params.id)

        const enroll = await prisma.enroll.findFirst({
            where: {
                id: enrollId,
                classId: student.crOf.id,
            },
            include: {
                class: true,
            },
        })

        if (!enroll) throw { message: 'no such enroll', status: 404 }

        // Cannot delete enrollment of CR
        if (enroll.studentId === student.id)
            throw { message: "cannot delete cr's enrollment", status: 400 }

        // Cannot delete VCR's enrollment
        if (enroll.studentId === enroll.class.vcrId)
            throw { message: "cannot delete vcr's enrollment", status: 400 }

        const deletedEnroll = await prisma.$transaction(async (tx) => {
            // Delete the enroll
            const deletedEnroll = await tx.enroll.delete({
                where: {
                    id: enrollId,
                },
                include: {
                    student: true,
                },
            })

            // Delete the announcements
            await tx.announcement.deleteMany({
                where: {
                    classId: deletedEnroll.classId,
                    userId: deletedEnroll.student.userId,
                },
            })

            // Delete the associated messages
            await tx.message.deleteMany({
                where: {
                    OR: [
                        {
                            senderId: deletedEnroll.student.userId,
                        },
                        {
                            receiverId: deletedEnroll.student.userId,
                        },
                    ],
                },
            })

            return deletedEnroll
        })

        // Send student removed information to the class
        io.in([`private/${deletedEnroll.classId}`]).emit(
            'student_removed',
            deletedEnroll.student.userId
        )

        res.json(deletedEnroll)
    })
)

module.exports = router
