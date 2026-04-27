"use server";

import Watchlist from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStocksDetails } from "./finnhub.actions";

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
export const addToWatchList = async (symbol: string, company: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    // Check if stock already exists in watchlist
    const existingItem = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existingItem) {
      return { success: false, message: "Stock already exists in watchlist." };
    }

    // else add to watchlist
    const newItem = new Watchlist({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      company: company.trim(),
    });
    await newItem.save();
    // Todo: add toast before commit
    revalidatePath("/watchlist");
    return { success: true, message: "Stock added to watchlist." };
  } catch (error) {
    console.error("Error adding stock to watchlist (addToWatchList)", error);
    throw new Error("Failed to add stock to watchlist.");
  }
};

// Remove stock from watchlist
export const removeFromWatchlist = async (symbol: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    // Remove from watchlist
    await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });
    revalidatePath("/watchlist");
    return { success: true, message: "Stock removed from watchlist" };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw new Error("Failed to remove stock from watchlist");
  }
};

// Get user's watchlist
export const getUserWatchlist = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    if (watchlist.length === 0) return [];

    const stocksWithData = await Promise.all(
      watchlist.map(async (item) => {
        const stockData = await getStocksDetails(item.symbol);

        if (!stockData) {
          console.warn(`Failed to fetch data for ${item.symbol}`);
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
      }),
    );

    return JSON.parse(JSON.stringify(stocksWithData));
  } catch (error) {
    console.error("Error loading watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};
