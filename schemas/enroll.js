const Joi = require('joi')

const schema = Joi.object({
    classId: Joi.number().required(),
})

module.exports = schema