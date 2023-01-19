const express = require('express')
const asyncWrapper = require('../lib/asyncWrapper')
const prisma = require('../app/db')
const userSchema = require('../schemas/user')
const { hash } = require('../lib/crypto')
const auth = require('../middlewares/auth')
const router = express.Router()

// TODO
router.get(
    '/',
    auth, 
    asyncWrapper(async (req, res, next) => {
        const users = await prisma.user.findMany({
            include: {
                teacher: true,
                student: true,
            },
        })
        res.json(users)
    })
)

router.post(
    '/',
    asyncWrapper(async (req, res, next) => {
        const { error, value: userData } = userSchema.validate(req.body)
        if (error) throw { message: error.message, status: 400 }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        username: userData.username,
                    },
                    {
                        email: userData.email,
                    },
                ],
            },
        })

        if (user)
            throw {
                message: 'username or email already exists',
                status: 400,
            }

        const password = await hash(userData.password)
        const newUser = await prisma.user.create({
            data: { ...userData, password },
        })

        res.status(201)
        res.json(newUser)
    })
)

module.exports = router
