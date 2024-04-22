const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

function sendEmail(subject, content, receiver) {
  return transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: receiver,
    subject,
    text: content,
  });
}

module.exports = { sendEmail };
