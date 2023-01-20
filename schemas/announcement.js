const Joi = require('joi')

const schema = Joi.object({
    content: Joi.string().trim().min(2).max(500).required(),
    classId: Joi.number().required(),
})

module.exports = schema
