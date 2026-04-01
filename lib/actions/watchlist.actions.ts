"use server";

import Watchlist from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";

type BetterAuthUserRecord = {
  _id?: { toString: () => string } | null;
  id?: string | null;
};

type WatchlistSymbolRecord = {
  symbol: string;
};

const USER_COLLECTION_NAME = "user";

const resolveUserId = (user: BetterAuthUserRecord | null): string => {
  if (!user) return "";
  if (typeof user.id === "string" && user.id.trim().length > 0) return user.id;
  if (user._id) return user._id.toString();
  return "";
};

export const getWatchlistSymbolsByEmail = async (
  email: string,
): Promise<string[]> => {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return [];
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return [];
    // Better-auth stores users in the "user" collection
    const user = await db
      .collection<BetterAuthUserRecord>(USER_COLLECTION_NAME)
      .findOne({ email: normalizedEmail });

    const userId = resolveUserId(user);
    if (!userId) return [];

    const watchlistItems = await Watchlist.find({ userId })
      .select({ symbol: 1, _id: 0 })
      .lean<WatchlistSymbolRecord[]>();

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error(
      "Error fetching watchlist symbols by email (getWatchlistSymbolsByEmail)",
      error,
    );
    return [];
  }
};
