import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

// authInstance (Singleton instance) -> it ensures that we only create one instance
// which prevent multiple connections and improve performance.
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    throw Error(`MongoDb connection not found`);
  }

  authInstance = betterAuth({
    database: mongodbAdapter(db as any),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,

    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        country: {
          type: "string",
        },
        timezone: {
          type: "string",
        },
        investmentGoals: {
          type: "string",
        },
        riskTolerance: {
          type: "string",
        },
        preferredIndustry: {
          type: "string",
        },
        lastNewsSentAt: {
          type: "date",
          defaultValue: null,
        },
      },
    },
    plugins: [nextCookies()],
  });

  return authInstance;
};

export const auth = await getAuth();
