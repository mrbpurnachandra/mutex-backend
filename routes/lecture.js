const express = require('express')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const student = require('../middlewares/student')
const cr = require('../middlewares/cr')
const asyncWrapper = require('../lib/asyncWrapper')
const lectureSchema = require('../schemas/lecture')
const router = express.Router()

router.use(auth, student, cr)

// CR adds lecturers to the class
router.post(
    '/',
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
                subject: lectureData.subject,
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



module.exports = router
