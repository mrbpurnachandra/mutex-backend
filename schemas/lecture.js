const Joi = require('joi')

const schema = Joi.object({
    teacherId: Joi.number().required(), 
    subject: Joi.string().trim().min(2).max(64).required()
})

module.exports = schema