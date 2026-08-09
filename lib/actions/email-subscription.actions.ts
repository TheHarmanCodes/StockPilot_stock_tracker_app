"use server";

import EmailSubscription from "@/database/models/email-subscription.model";
import { connectToDatabase } from "@/database/mongoose";
import {
  verifyResubscribeTokenForEmail,
  verifyUnsubscribeTokenForEmail,
} from "@/lib/email-subscription-links";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/auth-guard";

type BetterAuthUserRecord = {
  _id?: { toString: () => string } | null;
  id?: string | null;
  email?: string | null;
};

const USER_COLLECTION_NAME = "user";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Better Auth can expose either id or _id depending on the query source.
const resolveUserId = (user: BetterAuthUserRecord | null): string => {
  if (!user) return "";
  if (typeof user.id === "string" && user.id.trim().length > 0) return user.id;
  if (user._id) return user._id.toString();
  return "";
};

// Used by email-link routes where we only have the recipient email.
const findUserByEmail = async (email: string) => {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) return null;

  return db
    .collection<BetterAuthUserRecord>(USER_COLLECTION_NAME)
    .findOne({ email: normalizeEmail(email) });
};

// Central helper for subscribe/unsubscribe updates from dashboard, email links, or watchlist actions.
export const setEmailSubscriptionStatus = async ({
  userId,
  email,
  isSubscribed,
  source,
}: {
  userId?: string;
  email: string;
  isSubscribed: boolean;
  source: string;
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { success: false, message: "Email is required." };
  }

  try {
    await connectToDatabase();

    let resolvedUserId = userId?.trim() ?? "";

    if (!resolvedUserId) {
      const user = await findUserByEmail(normalizedEmail);
      resolvedUserId = resolveUserId(user);
    }

    if (!resolvedUserId) {
      return { success: false, message: "User not found." };
    }

    const now = new Date();

    await EmailSubscription.findOneAndUpdate(
      { userId: resolvedUserId },
      {
        $set: {
          userId: resolvedUserId,
          email: normalizedEmail,
          isSubscribed,
          source,
          subscribedAt: isSubscribed ? now : null,
          unsubscribedAt: isSubscribed ? null : now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return {
      success: true,
      message: isSubscribed
        ? "Daily news summary subscribed."
        : "Daily news summary unsubscribed.",
    };
  } catch (error) {
    console.error("Error updating email subscription status:", error);
    return {
      success: false,
      message: "Failed to update daily news summary preference.",
    };
  }
};

// Ensures new signups get a default "subscribed" record without duplicating existing rows.
export const ensureEmailSubscriptionRecord = async ({
  userId,
  email,
  source = "system",
}: {
  userId?: string;
  email: string;
  source?: string;
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail)
    return { success: false, message: "Email is required." };

  try {
    await connectToDatabase();

    let resolvedUserId = userId?.trim() ?? "";

    if (!resolvedUserId) {
      const user = await findUserByEmail(normalizedEmail);
      resolvedUserId = resolveUserId(user);
    }

    if (!resolvedUserId) {
      return { success: false, message: "User not found." };
    }

    const existingRecord = await EmailSubscription.findOne({
      userId: resolvedUserId,
    }).lean();

    if (existingRecord) {
      return { success: true, message: "Email subscription already exists." };
    }

    return setEmailSubscriptionStatus({
      userId: resolvedUserId,
      email: normalizedEmail,
      isSubscribed: true,
      source,
    });
  } catch (error) {
    console.error("Error ensuring email subscription record:", error);
    return { success: false, message: "Failed to ensure email subscription." };
  }
};

// Missing record means we keep existing users subscribed by default.
export const isEmailSubscribed = async (email: string): Promise<boolean> => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  try {
    await connectToDatabase();
    const subscription = await EmailSubscription.findOne({
      email: normalizedEmail,
    })
      .select({ isSubscribed: 1, _id: 0 })
      .lean<{ isSubscribed?: boolean } | null>();

    if (!subscription) {
      return true;
    }

    return Boolean(subscription.isSubscribed);
  } catch (error) {
    console.error("Error reading email subscription state:", error);
    return true;
  }
};

// Reads the user's current daily news preference from an already-resolved email.
export const getCurrentUserDailyNewsSubscriptionStatus = async (
  email: string,
) => {
  return isEmailSubscribed(email);
};

// Dashboard action for turning off daily summary emails.
export const unsubscribeCurrentUserFromDailyNews = async () => {
  const user = await requireVerifiedUser();

  const result = await setEmailSubscriptionStatus({
    userId: user.id,
    email: user.email,
    isSubscribed: false,
    source: "dashboard_unsubscribe",
  });

  revalidatePath("/");
  return result;
};

// Dashboard action for turning daily summary emails back on.
export const subscribeCurrentUserToDailyNews = async () => {
  const user = await requireVerifiedUser();

  const result = await setEmailSubscriptionStatus({
    userId: user.id,
    email: user.email,
    isSubscribed: true,
    source: "dashboard_subscribe",
  });

  revalidatePath("/");
  return result;
};

// Public email-link action for unsubscribe requests.
export const unsubscribeDailyNewsByEmail = async (
  email: string,
  token: string,
) => {
  try {
    // Re-check the signed token in the action so the mutation is protected
    // even if this helper is called from somewhere other than the page route.
    verifyUnsubscribeTokenForEmail(email, token);

    return setEmailSubscriptionStatus({
      email,
      isSubscribed: false,
      source: "email_unsubscribe_link",
    });
  } catch (error) {
    // Return a safe failure instead of changing subscription state when the
    // token is invalid, expired, or does not belong to the requested email.
    console.error("Invalid unsubscribe link:", error);
    return {
      success: false,
      message: "Invalid or expired unsubscribe link.",
    };
  }
};

// Public email-link action for resubscribe requests.
export const subscribeDailyNewsByEmail = async (
  email: string,
  token: string,
) => {
  try {
    // Apply the same protection to the resubscribe flow so both public email
    // links share the same signed, expiring authorization model.
    verifyResubscribeTokenForEmail(email, token);

    return setEmailSubscriptionStatus({
      email,
      isSubscribed: true,
      source: "email_resubscribe_link",
    });
  } catch (error) {
    // No state changes happen unless verification succeeds.
    console.error("Invalid resubscribe link:", error);
    return {
      success: false,
      message: "Invalid or expired resubscribe link.",
    };
  }
};
