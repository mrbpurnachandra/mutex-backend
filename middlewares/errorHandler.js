function errorHandler(err, req, res, next) {
    if (res.headersSent) next(err)

    res.status(err.status || 500)
    res.json({ message: err.status === 500 ? 'Server Error' : err.message })
}

module.exports = errorHandler
