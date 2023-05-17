const server = require('../app/httpServer')
const { Server } = require('socket.io')
const { verifyToken } = require('../lib/crypto')
const prisma = require('../app/db')
const {
    handleSendOldMessages,
    handleNewNormalMessage,
    handleNewSpecialMessage,
} = require('./messageHandlers')
const {
    handleSendOldAnnouncements,
    handleNewAnnouncement,
} = require('./announcementHandler')
const { handleSendOnlineStudents } = require('./onlineHandler')

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'https://mutex-frontend.onrender.com/',
        ],
        methods: ['POST', 'GET'],
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
            !user.verifiedOn ||
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
            socket.join([`private/${classId}`])

            // Register event handlers
            socket.on('send_old_messages', handleSendOldMessages(io, socket))
            socket.on(
                'send_old_announcements',
                handleSendOldAnnouncements(io, socket)
            )
            socket.on('new_normal_message', handleNewNormalMessage(io, socket))
            socket.on(
                'new_special_message',
                handleNewSpecialMessage(io, socket)
            )
            socket.on('new_announcement', handleNewAnnouncement(io, socket))
            socket.on(
                'send_online_students',
                handleSendOnlineStudents(io, socket)
            )
        } else {
            socket.join([`teacher/${user.id}`])

            // Register event handlers
            socket.on('send_old_messages', handleSendOldMessages(io, socket))
            socket.on(
                'send_old_announcements',
                handleSendOldAnnouncements(io, socket)
            )
            socket.on(
                'new_special_message',
                handleNewSpecialMessage(io, socket)
            )
            socket.on('new_announcement', handleNewAnnouncement(io, socket))
        }
    } catch (e) {
        console.log(e)
    }
})

module.exports = io
