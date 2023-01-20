function cr(req, res, next) {
    const student = req.student
    if (!student.crOf) throw { message: 'Unauthorized', status: 401 }

    next()
}

module.exports = cr
