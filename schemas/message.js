const Joi = require('joi')

// It works but I don't know why ? :D 
const normalMessageSchema = Joi.object({
    image: Joi.string().uri(),
    content: Joi.when('image', {
        is: undefined,
        otherwise: Joi.string().trim().min(2).max(500).required(),
        then: Joi.string().trim().allow('').required()
    }),
})

const specialMessageSchema = Joi.object({
    image: Joi.string().uri(),
    content: Joi.when('image', {
        is: undefined,
        otherwise: Joi.string().trim().min(2).max(500).required(),
        then: Joi.string().trim().allow('').required()
    }),
    classId: Joi.number().required(),
    receiverId: Joi.number().required(),
})

module.exports = {
    normalMessageSchema,
    specialMessageSchema,
}
