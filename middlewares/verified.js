const asyncWrapper = require('../lib/asyncWrapper')

async function verified(req, res, next) {
    const user = req.user
   
    if (!user.verifiedOn) throw { message: 'unauthorized', status: 401 }

    next()
}

module.exports = asyncWrapper(verified)
