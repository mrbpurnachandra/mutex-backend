const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')

async function announcer(req, res, next) {
    const user = req.user

    if (!user.student && !user.teacher)
        throw { message: 'unauthorized', status: 401 }
    if (user.student) {
        const student = await prisma.student.findFirst({
            where: {
                id: user.student.id,
            },
            include: {
                crOf: true,
                vcrOf: true,
            },
        })

        req.student = student

        if (!student.crOf && !student.vcrOf)
            throw { message: 'unauthorized', status: 401 }
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

        req.teacher = teacher

        if (!teacher.lectures.length)
            throw { message: 'unauthorized', status: 401 }
    }

    next()
}

module.exports = asyncWrapper(announcer)
