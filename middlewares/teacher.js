const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')

async function teacher(req, res, next) {
    const user = req.user
    const teacher = await prisma.teacher.findFirst({
        where: {
            userId: user.id,
        },
        include: {
            lectures: true,
        },
    })

    if (!teacher) throw { message: 'unauthorized', status: 401 }
    req.teacher = teacher

    next()
}

module.exports = asyncWrapper(teacher)
