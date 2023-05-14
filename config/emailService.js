const formData = require('form-data')
const Mailgun = require('mailgun.js')

const mailgun = new Mailgun(formData)

const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
})

function sendEmail(subject, content, receivers) {
    return mg.messages.create(
        'sandbox240e9e49850f43768363fedc7c0313fd.mailgun.org',
        {
            from: 'Mailgun Sandbox <postmaster@sandbox240e9e49850f43768363fedc7c0313fd.mailgun.org>',
            to: receivers,
            subject,
            text: content,
        }
    )
}

module.exports = { sendEmail }
