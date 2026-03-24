import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "stockpilot",
  ai: { gemini: { apikey: process.env.GEMINI_API_KEY } },
});
