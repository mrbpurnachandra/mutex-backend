const Joi = require('joi')

const schema = Joi.object({
    vcrId: Joi.number().required(),
})

module.exports = schema
