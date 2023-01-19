const Joi = require('joi')

const schema = Joi.object({
    description: Joi.string().trim().min(16).max(500).required(),
})

module.exports = schema
