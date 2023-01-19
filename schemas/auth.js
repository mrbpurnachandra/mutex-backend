const Joi = require('joi')

const schema = Joi.object({
    username: Joi.required(),
    password: Joi.required(),
})

module.exports = schema
