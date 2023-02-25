const prisma = require('../app/db')
const { normalMessageSchema } = require('../schemas/message')

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
                    orderBy: {
                        id: 'desc',
                    },
                    take: lastMessageId ? Infinity : 10,
                })
            }

            socket.emit('old_messages', messages)
        } catch (e) {
            // emit error
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
            })

            // Now we should emit
        } catch (e) {
            socket.emit('error', e)
        }
    }
}

function handleDeleteMessage() {}

module.exports = {
    handleSendOldMessages,
    handleNewNormalMessage,
}
