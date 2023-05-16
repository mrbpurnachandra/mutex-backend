function handleSendOnlineStudents(io, socket) {
    return async () => {
        try {
            const user = socket.user
            const classId = user.student.enroll.classId

            const sockets = await io.in(`private/${classId}`).fetchSockets()
            const usernames = []
            const users = sockets
                .map((s) => s.user)
                .map((s) => ({ name: s.name, username: s.username }))
                .filter((u) => {
                    const isPresent = usernames.indexOf(u.username) >= 0
                    usernames.push(u.username)
                    return !isPresent
                })

            socket.emit('online_students', users)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = {
    handleSendOnlineStudents,
}
