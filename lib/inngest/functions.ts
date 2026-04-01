import { getNews } from "../actions/finnhub.actions";
import {
  getAllUsersForNewsEmail,
  updateLastNewsSentAt,
} from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { alreadySentToday, formatDateToday, isTimeToSend } from "../utils";
import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";

type DailyNewsUser = Awaited<
  ReturnType<typeof getAllUsersForNewsEmail>
>[number];

type DailyNewsWithUser = {
  user: DailyNewsUser;
  symbols: string[];
  news: MarketNewsArticle[];
};

type DailyNewsSummaryWithUser = DailyNewsWithUser & {
  summary: string;
};

// This calls our model's chat endpoint, adding AI observability,
// metrics, datasets, and monitoring to our calls.
export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email", triggers: [{ event: "app/user.created" }] },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
    `;
    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile,
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining StockPilot. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;
      await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
      return {
        success: true,
        message: "Welcome email sent successfully",
      };
    });

    return {
      success: true,
      message: "Process Completed. Welcome email sent successfully",
    };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  {
    id: "daily-news-summary",
    retries: 1, // Not recommended, but only to prevent API call limit
    triggers: [{ event: "app/send.daily.news" }, { cron: "*/10 * * * *" }],
  },
  async ({ step }) => {
    // -------------------------------
    // Step 1: Fetch all users
    // -------------------------------
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0) {
      return { success: true, message: "No users found" };
    }

    // -------------------------------
    // FILTER USERS
    // -------------------------------
    const usersToSend = users.filter((user) => {
      const timeCheck = user.timezone && isTimeToSend(user.timezone);
      const sentCheck = !alreadySentToday(user);

      return timeCheck && sentCheck;
    });

    if (usersToSend.length === 0) {
      return { success: true, message: "No users to send right now" };
    }

    // -------------------------------
    // Step 2: Fetch news
    // -------------------------------
    const usersWithNews: DailyNewsWithUser[] = [];

    for (const [index, user] of usersToSend.entries()) {
      const userNews = await step.run(`fetch-news-${index}`, async () => {
        const symbols = await getWatchlistSymbolsByEmail(user.email);

        try {
          const news = await getNews(symbols);

          return {
            user,
            symbols,
            news: news.slice(0, 6),
          };
        } catch (error) {
          console.error("Error while fetching news: ", error);
          return { user, symbols, news: [] };
        }
      });

      usersWithNews.push(userNews);
    }

    // -------------------------------
    // Step 3: AI
    // -------------------------------
    const usersNewsSummaries: any[] = [];

    for (const { user, news } of usersWithNews) {
      if (news.length === 0) {
        usersNewsSummaries.push({ user, newsContent: null });
        continue;
      }
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(news, null, 2),
        );

        const response = await step.ai.infer(`summarize-${user.id}`, {
          model: step.ai.models.gemini({
            model: "gemini-2.5-flash-lite",
          }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent = (part && "text" in part ? part.text : null) || null;

        usersNewsSummaries.push({ user, newsContent });
      } catch (err) {
        console.error("Ai Summarization failure ", err);
        usersNewsSummaries.push({ user, newsContent: null });
      }
    }

    // -------------------------------
    // Step 4: EMAIL + DB
    // -------------------------------
    for (const { user, newsContent } of usersNewsSummaries) {
      if (!newsContent) {
        continue;
      }

      await step.run(`send-email-${user.id}`, async () => {
        await sendNewsSummaryEmail({
          email: user.email,
          date: formatDateToday(),
          newsContent,
        });
      });

      await step.run(`update-${user.id}`, async () => {
        await updateLastNewsSentAt(user.id);
      });
    }

    return {
      success: true,
      message: "Done",
    };
  },
);
