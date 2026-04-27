import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendDailyNewsSummary, sendSignUpEmail } from "@/lib/inngest/functions";

// by creating api that serves zero functions
//  here, we are essentially exposing our inngest functions by nextjs routes api routes which will make these below functions callableL
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendSignUpEmail, sendDailyNewsSummary],
});
