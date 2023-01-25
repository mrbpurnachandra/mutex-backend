const express = require('express')
const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')
const { match, generateToken } = require('../lib/crypto')
const authSchema = require('../schemas/auth')
const auth = require('../middlewares/auth')
const router = express.Router()

router.post(
    '/login',
    asyncWrapper(async (req, res, next) => {
        const { error, value: loginCredentials } = authSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const user = await prisma.user.findFirst({
            where: {
                username: loginCredentials.username,
            },
            include: {
                teacher: true,
                student: true,
            },
        })

        if (!user) throw { message: "user doesn't exist", status: 400 }

        const isMatch = await match(loginCredentials.password, user.password)
        if (!isMatch)
            throw { message: "username and password don't match", status: 400 }

        const token = await generateToken(user)
        res.json(token)
    })
)

// Refresh Token
router.get('/token', auth, asyncWrapper(async (req, res, next) => {
    const token = await generateToken(req.user)
    res.json(token)
}))

module.exports = router
