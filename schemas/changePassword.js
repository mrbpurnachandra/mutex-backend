const Joi = require('joi')

const schema = Joi.object({
    password: Joi.string().trim().min(4).required(),
    token: Joi.string().required(),
})

module.exports = schema
