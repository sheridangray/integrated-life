const nodemailer = require("nodemailer");

// Create a transporter object
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

// Set up email data
let mailOptions = {
  from: '"Your Name" <your-email@gmail.com>', // Sender address
  to: "recipient@example.com", // List of recipients
  subject: "Hello from Nodemailer", // Subject line
  text: "Hello world?", // Plain text body
  html: "<b>Hello world?</b>", // HTML body content
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log(error);
  }
  console.log("Message sent: %s", info.messageId);
});
