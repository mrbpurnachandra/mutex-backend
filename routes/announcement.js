const express = require('express')
const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')
const announcer = require('../middlewares/announcer')
const auth = require('../middlewares/auth')
const announcementSchema = require('../schemas/announcement')
const verified = require('../middlewares/verified')
const router = express.Router()

router.use(auth, verified)

router.post(
    '/',
    announcer,
    asyncWrapper(async (req, res, next) => {
        const user = req.user

        const { error, value: announcementData } = announcementSchema.validate(
            req.body
        )
        if (error) throw { message: error.message, status: 400 }

        const classId = announcementData.classId
        if (!isValidAnnouncer(req, classId))
            throw { message: 'unauthorized', status: 401 }

        const announcement = await prisma.announcement.create({
            data: {
                ...announcementData,
                userId: user.id,
            },
        })

        res.status(201)
        res.json(announcement)
    })
)

router.get(
    '/old/:lastAnnouncementId',
    asyncWrapper(async (req, res, next) => {
        const user = req.user
        const lastAnnouncementId = Number(req.params.lastAnnouncementId)

        if (isNaN(lastAnnouncementId))
            throw { message: 'Bad Request', status: 400 }

        let announcements = []
        if (user.student) {
            announcements = await prisma.announcement.findMany({
                where: {
                    classId: user.student.enroll.classId,
                    id: {
                        lt: lastAnnouncementId,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    id: 'desc',
                },
                take: 10,
            })
        } else {
            announcements = await prisma.announcement.findMany({
                where: {
                    userId: user.id,
                    id: {
                        lt: lastAnnouncementId,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    id: 'desc',
                },
                take: 10,
            })
        }

        res.json(announcements)
    })
)

function isValidAnnouncer(req, classId) {
    if (req.teacher) {
        return req.teacher.lectures.some(
            (lecture) => lecture.classId === classId
        )
    }
    if (req.student) {
        return (
            req.student.crOf?.id === classId ||
            req.student.vcrOf?.id === classId
        )
    }

    return false
}

module.exports = router
