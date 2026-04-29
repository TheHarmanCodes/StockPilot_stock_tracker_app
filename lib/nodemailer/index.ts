import nodemailer from "nodemailer";
import {
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
  STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./templates";

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

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date,
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: `"StockPilot" <${NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Market News Summary Today - ${date}`,
    text: "Today's market news summary from StockPilot",
    html: htmlTemplate,
  };
  await transporter.sendMail(mailOptions);
};

const replaceTemplateVariables = (
  template: string,
  values: Record<string, string>,
) =>
  Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  );

export const sendStockAlertEmail = async ({
  email,
  symbol,
  company,
  alertType,
  currentPrice,
  targetPrice,
  timestamp,
}: {
  email: string;
  symbol: string;
  company: string;
  alertType: "upper" | "lower";
  currentPrice: string;
  targetPrice: string;
  timestamp: string;
}) => {
  const template =
    alertType === "upper"
      ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
      : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;

  const htmlTemplate = replaceTemplateVariables(template, {
    symbol,
    company,
    currentPrice,
    targetPrice,
    timestamp,
    unsubscribeUrl: "https://stockpilot.vercel.app/",
  });

  const mailOptions = {
    from: `"StockPilot" <${NODEMAILER_EMAIL}>`,
    to: email,
    subject:
      alertType === "upper"
        ? `${symbol} crossed above ${targetPrice}`
        : `${symbol} crossed below ${targetPrice}`,
    text: `${symbol} is now ${currentPrice}. Your target was ${targetPrice}.`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
