const Joi = require('joi')

const normalMessageSchema = Joi.object({
    content: Joi.string().trim().min(2).max(500).required(),
})

const specialMessageSchema = Joi.object({
    content: Joi.string().trim().min(2).max(500).required(),
    classId: Joi.number().required(),
    receiverId: Joi.number().required(),
})

module.exports = {
    normalMessageSchema,
    specialMessageSchema,
}
