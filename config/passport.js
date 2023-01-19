const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy

const prisma = require('../app/db')
const { verifyToken } = require('../lib/crypto')

passport.use(
    new Strategy(async (token, cb) => {
        try {
            const payloadUser = await verifyToken(token)
            const user = await prisma.user.findFirst({
                where: {
                    id: payloadUser.id,
                },
                include: {
                    teacher: true,
                    student: true,
                },
            })

            if (!user) cb(null, false)
            cb(null, user)
        } catch (err) {
            err.status = 401
            cb(err)
        }
    })
)

module.exports = passport
