const server = require('../app')
const { Server } = require('socket.io')
const { verifyToken } = require('../lib/crypto')
const prisma = require('../app/db')
const {
    handleSendOldMessages,
    handleNewNormalMessage,
    handleNewSpecialMessage,
} = require('./handlers')

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
    },
})

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token

        const payloadUser = await verifyToken(token)
        const user = await prisma.user.findFirst({
            where: {
                id: payloadUser.id,
            },
            include: {
                teacher: true,
                student: {
                    include: {
                        enroll: {
                            include: {
                                class: true,
                            },
                        },
                    },
                },
            },
        })

        if (
            !user ||
            (user.student &&
                (!user.student.enroll ||
                    user.student.enroll.status === 'pending'))
        )
            throw new Error('unauthorized')

        socket.user = user

        next()
    } catch (e) {
        next(e)
    }
})

io.on('connection', async (socket) => {
    try {
        const user = socket.user
        if (user.student) {
            const classId = user.student.enroll.classId

            // Join the corresponding rooms
            socket.join([`private/${classId}`, `public/${classId}`])

            // Register event handlers
            socket.on('send_old_messages', handleSendOldMessages(io, socket))
            socket.on('new_normal_message', handleNewNormalMessage(io, socket))
            socket.on(
                'new_special_message',
                handleNewSpecialMessage(io, socket)
            )
        } else {
            const classes = await prisma.lecture.findMany({
                where: {
                    teacherId: user.teacher.id,
                },
                select: {
                    classId: true,
                },
            })
            // Join Descision
            classes.forEach(c => {
                socket.join([`teacher/${c.classId}`])
            })

            // Register event handlers
            socket.on('send_old_messages', handleSendOldMessages(io, socket))
            socket.on(
                'new_special_message',
                handleNewSpecialMessage(io, socket)
            )
        }
    } catch (e) {
        console.log(e)
    }
})
