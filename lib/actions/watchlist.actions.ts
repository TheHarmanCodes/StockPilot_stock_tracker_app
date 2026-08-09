"use server";

import Watchlist from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";
import { revalidatePath } from "next/cache";
import { getStocksDetails } from "./finnhub.actions";
import { setEmailSubscriptionStatus } from "./email-subscription.actions";
import { requireVerifiedUser } from "@/lib/auth-guard";

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

// here using client 'Mail' id :-> we are retrieving all the stock symbols from db if any
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

// Add stock to watchlist
export const addToWatchList = async (
  symbol: string,
  company: string,
  revalidate: boolean = true,
) => {
  const user = await requireVerifiedUser();
  try {
    await connectToDatabase();
    // Check if stock already exists in watchlist
    const existingItem = await Watchlist.findOne({
      userId: user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existingItem) {
      return { success: false, message: "Stock already exists in watchlist." };
    }

    // else add to watchlist
    const newItem = new Watchlist({
      userId: user.id,
      symbol: symbol.toUpperCase(),
      company: company.trim(),
    });
    await newItem.save();
    if (user.email) {
      // Adding a stock signals renewed interest, so we automatically resume daily summaries.
      const subscriptionResult = await setEmailSubscriptionStatus({
        userId: user.id,
        email: user.email,
        isSubscribed: true,
        source: "watchlist_add",
      });
      if(!subscriptionResult.success){
        console.warn("Watchlist added, but failed to resume daily summaries: ", subscriptionResult.message)
      }
    }
    if (revalidate) {
      revalidatePath("/watchlist");
    }
    return { success: true, message: "Stock added to watchlist." };
  } catch (error) {
    console.error("Error adding stock to watchlist (addToWatchList)", error);
    throw new Error("Failed to add stock to watchlist.");
  }
};

// Remove stock from watchlist
export const removeFromWatchlist = async (
  symbol: string,
  revalidate: boolean = true,
) => {
  const user = await requireVerifiedUser();
  try {
    await connectToDatabase();
    // Remove from watchlist
    await Watchlist.deleteOne({
      userId: user.id,
      symbol: symbol.toUpperCase(),
    });
    if (revalidate) {
      revalidatePath("/watchlist");
    }
    return { success: true, message: "Stock removed from watchlist" };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw new Error("Failed to remove stock from watchlist");
  }
};

// Get user's watchlist
export const getUserWatchlist = async () => {
  const user = await requireVerifiedUser();
  try {
    await connectToDatabase();
    const watchlist = await Watchlist.find({ userId: user.id })
      .sort({ addedAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(watchlist));
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};

// Get user's watchlist with stock data
export const getWatchlistWithData = async () => {
  try {
    const user = await requireVerifiedUser();

    const watchlist = await Watchlist.find({ userId: user.id })
      .sort({ addedAt: -1 })
      .lean();

    if (watchlist.length === 0) return [];

    const stocksWithData = await Promise.all(
      watchlist.map(async (item) => {
        try {
          const stockData = await getStocksDetails(item.symbol);
          if (stockData == null) {
            return item;
          }
          return {
            company: stockData.company,
            symbol: stockData.symbol,
            currentPrice: stockData.currentPrice,
            priceFormatted: stockData.priceFormatted,
            changeFormatted: stockData.changeFormatted,
            changePercent: stockData.changePercent,
            marketCap: stockData.marketCapFormatted,
            peRatio: stockData.peRatio,
          };
        } catch (err) {
          console.warn(`Failed to fetch data for ${item.symbol}`, err);
          return item;
        }
      }),
    );

    return JSON.parse(JSON.stringify(stocksWithData));
  } catch (error) {
    console.error("Error loading watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};
