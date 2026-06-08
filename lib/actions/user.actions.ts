"use server";

import { connectToDatabase } from "@/database/mongoose";
import { ObjectId } from "mongodb";
import EmailSubscription from "@/database/models/email-subscription.model";

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Mongoose connection not connected");

    const users = await db
      .collection("user")
      .find(
        { email: { $exists: true, $ne: null } },
        {
          projection: {
            _id: 1,
            email: 1,
            name: 1,
            country: 1,
            timezone: 1,
            lastNewsSentAt: 1,
          },
        },
      )
      .toArray();

    // We join user records with subscription records so Inngest can skip unsubscribed users.
    const emails = users
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email))
      .map((email) => email.trim().toLowerCase());

    const subscriptions = await EmailSubscription.find({
      email: { $in: emails },
    })
      .select({ email: 1, isSubscribed: 1, _id: 0 })
      .lean<{ email: string; isSubscribed: boolean }[]>();

    const subscriptionMap = new Map(
      subscriptions.map((subscription) => [
        subscription.email,
        subscription.isSubscribed,
      ]),
    );

    return users
      .filter((user) => user.email && user.name && user._id)
      .map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        lastNewsSentAt: user.lastNewsSentAt,
          isDailyNewsSubscribed:subscriptionMap.get(user.email.trim().toLowerCase()) ?? true,
      }));
  } catch (err) {
    console.log("Error while fetching users for news email ", err);
    return [];
  }
};

export const updateLastNewsSentAt = async (userId: string) => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Mongoose connection not connected");

    const result = await db
      .collection("user")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { lastNewsSentAt: new Date() } },
      );

    return { success: result.matchedCount > 0 };
  } catch (err) {
    console.error("Error updating lastNewsSentAt:", err);
    return { success: false };
  }
};
