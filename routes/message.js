const express = require('express')
const prisma = require('../app/db')
const auth = require('../middlewares/auth')
const student = require('../middlewares/student')
const announcer = require('../middlewares/announcer')
const asyncWrapper = require('../lib/asyncWrapper')
const {
    normalMessageSchema,
    specialMessageSchema,
} = require('../schemas/message')
const enrolled = require('../middlewares/enrolled')
const router = express.Router()

router.use(auth)

router.post(
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

// Delete is same for both type of messages
router.delete(
    '/:id',
    asyncWrapper(async (req, res, next) => {
        const messageId = Number(req.params.id)

        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                senderId: req.user.id,
            },
        })

        if (!message) throw { message: 'no such message', status: 404 }

        const deletedMessage = await prisma.message.delete({
            where: {
                id: messageId,
            },
        })

        res.json(deletedMessage)
    })
)

router.post(
    '/special',
    announcer,
    asyncWrapper(async (req, res, next) => {
        const { error, value: specialMessageData } =
            specialMessageSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const senderId = req.user.id
        const { receiverId, classId } = specialMessageData

        const receiver = await prisma.user.findFirst({
            where: {
                id: receiverId,
            },
            include: {
                teacher: {
                    include: {
                        lectures: true,
                    },
                },
                student: {
                    include: {
                        enroll: true,
                        crOf: true,
                        vcrOf: true,
                    },
                },
            },
        })

        if (!receiver) throw { message: 'no such receiver', status: 400 }

        if (
            (req.student && receiver.student) ||
            (req.teacher && receiver.teacher)
        )
            throw {
                message: 'sender and receiver cannot be of same type',
                status: 400,
            }

        if (!isValidSender(req, classId))
            throw { message: 'unauthorized', status: 401 }
        if (!isValidReceiver(receiver, classId))
            throw { message: 'invalid receiver', status: 400 }

        const message = await prisma.message.create({
            data: {
                ...specialMessageData,
                senderId,
            },
        })

        res.status(201)
        res.json(message)
    })
)

router.get(
    '/:classId/:receiverId/:lastMessageId',
    asyncWrapper(async (req, res, next) => {
        const classId = Number(req.params.classId)
        const receiverId = Number(req.params.receiverId)
        const lastMessageId = Number(req.params.lastMessageId)

        let messages = []

        const filter = {
            classId: classId,
            id: {
                lt: lastMessageId,
            },
        }

        if (req.user.student) {
            if (isNaN(receiverId)) {
                filter.receiverId = null
            } else {
                filter.OR = [
                    { senderId: receiverId },
                    { receiverId: receiverId },
                ]
            }
        }

        if (req.user.teacher) {
            filter.OR = [{ senderId: req.user.id }, { receiverId: req.user.id }]
        }

        messages = await prisma.message.findMany({
            where: filter,
            include: {
                sender: {
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

        res.status(200)
        res.send(messages)
    })
)

function isValidSender(req, classId) {
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

async function isValidReceiver(receiver, classId) {
    if (!receiver) return false

    if (receiver.teacher) {
        return receiver.teacher.lectures.some(
            (lecture) => lecture.classId === classId
        )
    }

    if (receiver.student) {
        return (
            receiver.student.crOf?.id === classId ||
            receiver.student.vcrOf?.id === classId
        )
    }

    return false
}
module.exports = router
