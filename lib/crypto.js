const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

function hash(password) {
    return bcrypt.hash(password, 10)
}

function match(password, hash) {
    return bcrypt.compare(password, hash)
}

function generateToken(payload) {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, process.env.JWT_SECRET_KEY, {}, (err, token) => {
            if (err) reject(err)
            resolve(token)
        })
    })
}

function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
            if (err) reject(err)
            resolve(payload)
        })
    })
}

module.exports = {
    hash,
    match,
    generateToken,
    verifyToken,
}
