const prisma = require('../app/db')
const {
    normalMessageSchema,
    specialMessageSchema,
} = require('../schemas/message')

function handleSendOldMessages(io, socket) {
    return async (lastMessageId) => {
        try {
            const user = socket.user

            let messages = []
            if (user.student) {
                messages = await prisma.message.findMany({
                    where: {
                        classId: user.student.enroll.classId,
                        id: {
                            gt: lastMessageId ?? 0,
                        },
                    },
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
                    take: lastMessageId ? Infinity : 10,
                })
            } else {
                messages = await prisma.message.findMany({
                    where: {
                        OR: [{ senderId: user.id }, { receiverId: user.id }],
                        id: {
                            gt: lastMessageId ?? 0,
                        },
                    },
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
                    take: lastMessageId ? Infinity : 10,
                })
            }

            socket.emit('old_messages', messages)
        } catch (e) {
            socket.emit('error', e)
        }
    }
}

function handleNewNormalMessage(io, socket) {
    return async (message) => {
        try {
            const student = socket.user.student
            const classId = student.enroll.classId

            const { error, value: normalMessageData } =
                normalMessageSchema.validate(message)

            if (error) throw { message: error.message }

            const normalMessage = await prisma.message.create({
                data: {
                    ...normalMessageData,
                    classId,
                    senderId: socket.user.id,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            })

            io.in(`private/${classId}`).emit('new_message', normalMessage)
        } catch (e) {
            socket.emit('error', e)
        }
    }
}

function handleNewSpecialMessage(io, socket) {
    return async (messageData) => {
        try {
            await canSendSpecialMessage(socket.user)
            const { error, value: specialMessageData } =
                specialMessageSchema.validate(messageData)
            if (error) throw { message: error.message }

            const senderId = socket.user.id
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

            if (!receiver) throw { message: 'no such receiver' }

            if (
                (socket.user.student && receiver.student) ||
                (socket.user.teacher && receiver.teacher)
            )
                throw {
                    message: 'sender and receiver cannot be of same type',
                }

            if (!isValidSender(socket.user, classId))
                throw { message: 'unauthorized' }
            if (!isValidReceiver(receiver, classId))
                throw { message: 'invalid receiver' }

            const message = await prisma.message.create({
                data: {
                    ...specialMessageData,
                    senderId,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            })

            io.in(`public/${classId}`).emit('new_message', message)
            io.in(`teacher/${classId}`).emit('new_message', message)
        } catch (e) {
            socket.emit('error', e)
        }
    }
}

function handleDeleteMessage() {}

async function canSendSpecialMessage(user) {
    if (!user.student && !user.teacher) throw { message: 'unauthorized' }
    if (user.student) {
        const student = await prisma.student.findFirst({
            where: {
                id: user.student.id,
            },
            include: {
                crOf: true,
                vcrOf: true,

                enroll: {
                    include: {
                        class: true,
                    },
                },
            },
        })
        console.log('Test - student', student)
        user.student = student
        if (!student.crOf && !student.vcrOf) throw { message: 'unauthorized' }
    }

    if (user.teacher) {
        const teacher = await prisma.teacher.findFirst({
            where: {
                id: user.teacher.id,
            },
            include: {
                lectures: true,
            },
        })

        user.teacher = teacher

        if (!teacher.lectures.length)
            throw { message: 'unauthorized', status: 401 }
    }
}

function isValidSender(user, classId) {
    if (user.teacher) {
        return user.teacher.lectures.some(
            (lecture) => lecture.classId === classId
        )
    }
    if (user.student) {
        return (
            user.student.crOf?.id === classId ||
            user.student.vcrOf?.id === classId
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

module.exports = {
    handleSendOldMessages,
    handleNewNormalMessage,
    handleNewSpecialMessage,
}
