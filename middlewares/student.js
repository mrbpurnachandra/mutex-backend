const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')

async function student(req, res, next) {
    const user = req.user
    const student = await prisma.student.findFirst({
        where: {
            userId: user.id,
        },
        include: {
            crOf: true,
            vcrOf: true,
        },
    })
    if (!student) throw { message: 'unauthorized', status: 401 }
    req.student = student

    next()
}

module.exports = asyncWrapper(student)
