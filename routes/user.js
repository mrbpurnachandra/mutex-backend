const express = require('express')
const asyncWrapper = require('../lib/asyncWrapper')
const prisma = require('../app/db')
const userSchema = require('../schemas/user')
const { hash } = require('../lib/crypto')
const router = express.Router()

router.post(
    '/register',
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

        if (user) throw { message: 'username or password already exists', status: 400 }

        const password = await hash(userData.password)
        const newUser = await prisma.user.create({
            data: { ...userData, password },
        })

        res.status(201)
        res.json(newUser)
    })
)

module.exports = router
