const prisma = require('../app/db')
const announcementSchema = require('../schemas/announcement')

function handleSendOldAnnouncements(io, socket) {
    return async (lastAnnouncementId) => {
        try {
            const user = socket.user

            let announcements = []
            if (user.student) {
                announcements = await prisma.announcement.findMany({
                    where: {
                        classId: user.student.enroll.classId,
                        id: {
                            gt: lastAnnouncementId ?? 0,
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
                        class: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                    orderBy: {
                        id: 'desc',
                    },
                    take: lastAnnouncementId ? Infinity : 10,
                })
            } else {
                announcements = await prisma.announcement.findMany({
                    where: {
                        userId: user.id,
                        id: {
                            gt: lastAnnouncementId ?? 0,
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
                        class: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                    orderBy: {
                        id: 'desc',
                    },
                    take: lastAnnouncementId ? Infinity : 10,
                })
            }

            socket.emit('old_announcements', announcements)
        } catch (e) {
            socket.emit('error', e)
        }
    }
}

function handleNewAnnouncement(io, socket) {
    return async (announcementData) => {
        try {
            const user = socket.user
            await canAnnounce(socket.user)

            const { error, value: announcementRequestData } =
                announcementSchema.validate(announcementData)
            if (error) throw { message: error.message }

            const classId = announcementRequestData.classId
            if (!isValidAnnouncer(user, classId))
                throw { message: 'unauthorized' }

            const announcement = await prisma.announcement.create({
                data: {
                    ...announcementRequestData,
                    userId: user.id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    class: {
                        select: {
                            name: true,
                            description: true,
                        },
                    },
                },
            })

            io.in(`private/${classId}`).emit('new_announcement', announcement)
            if (socket.user.teacher) {
                io.in(`teacher/${announcement.userId}`).emit(
                    'new_announcement',
                    announcement
                )
            }
        } catch (e) {
            socket.emit('error', e)
        }
    }
}

async function canAnnounce(user) {
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

function isValidAnnouncer(user, classId) {
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

module.exports = {
    handleSendOldAnnouncements,
    handleNewAnnouncement,
}
