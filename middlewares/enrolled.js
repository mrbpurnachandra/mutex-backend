function enrolled(req, res, next) {
    const student = req.student

        if (
            !student.enroll ||
            !(student.enroll && student.enroll.status === 'approved')
        )
            throw { message: 'unauthorized', status: 401 }

    next()
}

module.exports = enrolled
