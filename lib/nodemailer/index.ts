import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;
const NODEMAILER_PASSWORD = process.env.NODEMAILER_PASSWORD;

if (!NODEMAILER_EMAIL || !NODEMAILER_PASSWORD) {
  throw new Error("Missing Nodemailer SMTP credentials");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASSWORD,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro,
  );

  const mailOptions = {
    from: `"StockPilot" <${NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Welcome to StockPilot - your stock market toolkit is ready!`,
    text: "Thanks for joining StockPilot",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
