const passport = require('../config/passport')

module.exports = passport.authenticate('bearer', { session: false })
