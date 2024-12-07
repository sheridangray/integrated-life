const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const nodemailer = require("nodemailer");

const testEmailTransport = async () => {
  try {
    console.log("Setting up email transporter...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      debug: true,
    });

    console.log("Sending test email...");
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: "Test Email",
      text: "This is a test email to verify email transporter configuration.",
    });

    console.log("Test email sent successfully.");
  } catch (error) {
    console.error("Error sending test email:", error);
  }
};

testEmailTransport();
