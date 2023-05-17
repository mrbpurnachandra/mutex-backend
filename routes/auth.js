const express = require('express')
const prisma = require('../app/db')
const asyncWrapper = require('../lib/asyncWrapper')
const {
    match,
    generateToken,
    verifyToken,
    hash,
    generateTokenWithTime,
} = require('../lib/crypto')
const authSchema = require('../schemas/auth')
const auth = require('../middlewares/auth')
const changePasswordSchema = require('../schemas/changePassword')
const { sendEmail } = require('../config/emailService')
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

        if (!user) throw { message: "user doesn't exist", status: 400 }

        const isMatch = await match(loginCredentials.password, user.password)
        if (!isMatch)
            throw { message: "username and password don't match", status: 400 }

        const token = await generateToken(user)
        res.json(token)
    })
)

router.post(
    '/forgot-password',
    asyncWrapper(async (req, res, next) => {
        let { username } = req.body

        if (!username || !username.trim())
            throw { message: 'please provide username', status: 400 }

        const user = await prisma.user.findFirst({
            where: {
                username,
            },
            select: {
                id: true,
                username: true,
                email: true,
            },
        })

        if (!user) throw { message: "user doesn't exist", status: 400 }

        const token = await generateTokenWithTime({ id: user.id }, '5m')

        await sendEmail('Password Reset Token', `Token: ${token}`, user.email)

        res.json({ message: 'Email sent' })
    })
)

router.post(
    '/change-password',
    asyncWrapper(async (req, res, next) => {
        const { error, value } = changePasswordSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const { password, token } = value
        const payload = await verifyToken(token)
        const hashedPassword = await hash(password)

        await prisma.user.update({
            where: {
                id: payload.id,
            },
            data: {
                password: hashedPassword,
            },
        })

        res.json({ message: 'Password updated' })
    })
)

router.post(
    '/resend-token',
    auth,
    asyncWrapper(async (req, res, next) => {
        const user = req.user

        const token = await generateTokenWithTime({ id: user.id }, '5m')

        await sendEmail('Verification Token', `Token: ${token}`, user.email)

        res.json({ message: 'Token sent' })
    })
)

router.post(
    '/verify',
    asyncWrapper(async (req, res, next) => {
        const { token } = req.body
        if (!token) throw { message: 'token is required', status: 400 }

        const payload = await verifyToken(token)

        await prisma.user.update({
            where: {
                id: payload.id,
            },
            data: {
                verifiedOn: new Date(),
            },
        })

        res.json({ message: 'User verified' })
    })
)

// Refresh Token
router.get(
    '/token',
    auth,
    asyncWrapper(async (req, res, next) => {
        const token = await generateToken(req.user)
        res.json(token)
    })
)

module.exports = router
