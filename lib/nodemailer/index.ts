import nodemailer from "nodemailer";
import { DASHBOARD_URL } from "@/lib/constants";
import {
  buildResubscribeDailyNewsUrl,
  buildUnsubscribeDailyNewsUrl,
} from "@/lib/email-subscription-links";
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
  // The welcome email includes the signed unsubscribe URL so the recipient can
  // manage preferences without exposing a raw email address in the link.
  const htmlTemplate = replaceTemplateVariables(WELCOME_EMAIL_TEMPLATE, {
    name,
    intro,
    unsubscribeUrl: buildUnsubscribeDailyNewsUrl(email),
    dashboardUrl: DASHBOARD_URL,
  });

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
  // Build fresh signed links for this specific recipient so the footer and mail
  // client subscription controls both carry the same protected token.
  const unsubscribeUrl = buildUnsubscribeDailyNewsUrl(email);
  const resubscribeUrl = buildResubscribeDailyNewsUrl(email);
  const htmlTemplate = replaceTemplateVariables(NEWS_SUMMARY_EMAIL_TEMPLATE, {
    date,
    newsContent,
    unsubscribeUrl,
    dashboardUrl: DASHBOARD_URL,
  });

  const mailOptions = {
    from: `"StockPilot" <${NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Market News Summary Today - ${date}`,
    text: "Today's market news summary from StockPilot",
    html: htmlTemplate,
    list: {
      // These headers mirror the footer links and point to the same signed
      // unsubscribe/resubscribe endpoints.
      help: `mailto:${NODEMAILER_EMAIL}?subject=StockPilot%20help`,
      unsubscribe: {
        url: unsubscribeUrl,
        comment: "Unsubscribe from daily summary",
      },
      subscribe: {
        url: resubscribeUrl,
        comment: "Resubscribe to daily summary",
      },
    },
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
    unsubscribeUrl: buildUnsubscribeDailyNewsUrl(email),
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
