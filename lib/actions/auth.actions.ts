"use server";

import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";
import { ensureEmailSubscriptionRecord } from "./email-subscription.actions";

export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  country,
  timezone,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    if (!auth) throw new Error("Auth not initialized");
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
        country,
        timezone,
        investmentGoals,
        riskTolerance,
        preferredIndustry,
      },
    });

    if (response) {
      // New accounts start subscribed so the daily summary works immediately unless they opt out later.
      await ensureEmailSubscriptionRecord({
        userId: response.user.id,
        email,
        source: "sign_up",
      });

      await inngest.send({
        name: "app/user.created",
        data: {
          userId: response.user.id,
          email,
          name: fullName,
          country,
          timezone,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
        },
      });
    }
    return { success: true, data: response };
  } catch (e) {
    console.error("Sign up failed", e);
    return { success: false, error: "Sign up failed" };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
    });

    return { success: true, data: response };
  } catch (e) {
    console.error("Sign in failed", e);
    return { success: false, error: "Sign in failed" };
  }
};

export const signOut = async () => {
  try {
    await auth?.api.signOut({ headers: await headers() });
    return { success: true };
  } catch (e) {
    console.log("Sign out failed", e);
    return { success: false, error: "Sign out failed" };
  }
};
