const express = require('express')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const student = require('../middlewares/student')
const cr = require('../middlewares/cr')
const asyncWrapper = require('../lib/asyncWrapper')
const lectureSchema = require('../schemas/lecture')
const router = express.Router()

router.use(auth)

//TODO -  Remaining to check
router.get(
    '/',
    asyncWrapper(async (req, res, next) => {
        const user = req.user

        let lectures = []
        if (user.teacher) {
            lectures = await prisma.lecture.findMany({
                where: {
                    teacherId: user.teacher.id,
                },
                include: {
                    class: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
            })
        } else if (user.student) {
             if (
                    !user.student.enroll ||
                    !(user.student.enroll && user.student.enroll.status === 'approved')
                )
                    throw { message: 'unauthorized', status: 401 }

            lectures = await prisma.lecture.findMany({
                where: {
                    classId: user.student.enroll.classId,
                },
                include: {
                    class: true,
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                },
            })
        }
        
        return res.json(lectures)
    })
)

// CR adds lecturers to the class
router.post(
    '/',
    student,
    cr,
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const classId = student.crOf.id

        const { error, value: lectureData } = lectureSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const teacher = await prisma.teacher.findFirst({
            where: {
                id: lectureData.teacherId,
            },
        })

        if (!teacher) throw { message: 'no such teacher', status: 404 }

        const lecture = await prisma.lecture.findFirst({
            where: {
                classId,
                teacherId: teacher.id,
            },
        })

        if (lecture) throw { message: 'lecture already exists', status: 400 }
        const newLecture = await prisma.lecture.create({
            data: {
                ...lectureData,
                classId,
            },
        })

        res.json(newLecture)
    })
)

// Cr can remove lectures from class
router.delete(
    '/:id',
    student,
    cr,
    asyncWrapper(async (req, res, next) => {
        const student = req.student
        const classId = student.crOf.id
        const lectureId = Number(req.params.id)
        const lecture = await prisma.lecture.findFirst({
            where: {
                id: lectureId,
                classId,
            },
        })
        if (!lecture) throw { message: 'no such lecture', status: 404 }

        const deletedLecture = await prisma.$transaction(async (tx) => {
            // Delete the Teacher
            const deletedLecture = await tx.lecture.delete({
                where: {
                    id: lectureId,
                },
                include: {
                    teacher: true,
                },
            })

            // Delete associated announcements
            await tx.announcement.deleteMany({
                where: {
                    userId: deletedLecture.teacher.userId,
                    classId,
                },
            })
            // Delete associated messages
            // TODO - test

            await tx.message.deleteMany({
                where: {
                    OR: [
                        {
                            senderId: deletedLecture.teacher.userId,
                        },
                        {
                            receiverId: deletedLecture.teacher.userId,
                        },
                    ],
                    classId,
                },
            })

            return deletedLecture
        })

        res.json(deletedLecture)
    })
)

module.exports = router
