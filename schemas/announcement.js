const Joi = require('joi')

const schema = Joi.object({
    image: Joi.string().uri(),
    content: Joi.when('image', {
        is: undefined,
        otherwise: Joi.string().trim().min(2).max(500).required(),
        then: Joi.string().trim().allow('').required(),
    }),
    classId: Joi.number().required(),
})

module.exports = schema
