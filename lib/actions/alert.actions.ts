"use server";

import AlertModel, {
  type AlertFrequency,
  type AlertItem,
  type AlertType,
} from "@/database/models/alert.model";
import Watchlist from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { sendStockAlertEmail } from "@/lib/nodemailer";
import { formatPrice } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStocksDetails } from "./finnhub.actions";

type AlertPayload = {
  symbol: string;
  company: string;
  alertName: string;
  alertType: AlertType;
  threshold: number;
  frequency?: AlertFrequency;
};

const ALERT_FREQUENCIES: AlertFrequency[] = ["once", "hourly", "daily"];
const ALERT_TYPES: AlertType[] = ["upper", "lower"];

const serializeAlert = (alert: Record<string, any>): Alert => ({
  id: alert._id?.toString?.() ?? alert.id,
  symbol: alert.symbol,
  company: alert.company,
  alertName: alert.alertName,
  currentPrice: Number(alert.currentPrice ?? 0),
  alertType: alert.alertType,
  threshold: Number(alert.threshold),
  changePercent: alert.changePercent,
  frequency: alert.frequency ?? "once",
  isActive: Boolean(alert.isActive ?? true),
  lastTriggeredAt: alert.lastTriggeredAt
    ? new Date(alert.lastTriggeredAt).toISOString()
    : undefined,
});

const getCurrentUser = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) redirect("/sign-in");
    return session.user;
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    // Handle other errors
    console.error("Error getting current user:", error);
    redirect("/sign-in");
  }
};

const normalizeAlertPayload = (payload: AlertPayload) => {
  const symbol = payload.symbol?.trim().toUpperCase();
  const company = payload.company?.trim();
  const alertName = payload.alertName?.trim();
  const threshold = Number(payload.threshold);
  const alertType = payload.alertType;
  const frequency = payload.frequency ?? "once";

  if (!symbol) throw new Error("Please choose a stock for this alert.");
  if (!company) throw new Error("Company name is required.");
  if (!alertName) throw new Error("Alert name is required.");
  if (!ALERT_TYPES.includes(alertType)) {
    throw new Error("Please choose a valid alert condition.");
  }
  if (!ALERT_FREQUENCIES.includes(frequency)) {
    throw new Error("Please choose a valid alert frequency.");
  }
  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new Error("Threshold must be greater than zero.");
  }

  return { symbol, company, alertName, alertType, threshold, frequency };
};

export const getUserAlerts = async (): Promise<Alert[]> => {
  try {
    await connectToDatabase();
    const user = await getCurrentUser();

    const alerts = await AlertModel.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    const alertsWithPrices = await Promise.all(
      alerts.map(async (alert) => {
        try {
          const stockData = await getStocksDetails(alert.symbol);
          return serializeAlert({
            ...alert,
            currentPrice: stockData?.currentPrice ?? 0,
            changePercent: stockData?.changePercent,
          });
        } catch {
          return serializeAlert(alert);
        }
      }),
    );

    return JSON.parse(JSON.stringify(alertsWithPrices));
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw new Error("Failed to fetch alerts");
  }
};

export const createAlert = async (payload: AlertPayload) => {
  try {
    await connectToDatabase();
    const user = await getCurrentUser();
    const normalized = normalizeAlertPayload(payload);

    const watchlistItem = await Watchlist.findOne({
      userId: user.id,
      symbol: normalized.symbol,
    });

    if (!watchlistItem) {
      return {
        success: false,
        message: "Add this stock to your watchlist before creating an alert.",
      };
    }
    if (!user.email) {
      return {
        success: false,
        message: "User email is required to create alerts.",
      };
    }
    await AlertModel.create({
      ...normalized,
      userId: user.id,
      userEmail: user.email.toLowerCase(),
      isActive: true,
    });

    revalidatePath("/watchlist");
    return { success: true, message: "Alert created successfully." };
  } catch (error: any) {
    if (error?.code === 11000) {
      return {
        success: false,
        message: "An alert with this name already exists for this stock.",
      };
    }

    console.error("Error creating alert:", error);
    return { success: false, message: "Failed to create alert." };
  }
};

export const updateAlert = async (alertId: string, payload: AlertPayload) => {
  try {
    await connectToDatabase();
    const user = await getCurrentUser();
    const normalized = normalizeAlertPayload(payload);

    const updated = await AlertModel.findOneAndUpdate(
      { _id: alertId, userId: user.id },
      {
        ...normalized,
        isActive: true,
      },
      { new: true },
    );

    if (!updated) {
      return { success: false, message: "Alert not found." };
    }

    revalidatePath("/watchlist");
    return { success: true, message: "Alert updated successfully." };
  } catch (error: any) {
    if (error?.code === 11000) {
      return {
        success: false,
        message: "An alert with this name already exists for this stock.",
      };
    }

    console.error("Error updating alert:", error);
    return { success: false, message: "Failed to update alert." };
  }
};

export const deleteAlert = async (alertId: string) => {
  try {
    await connectToDatabase();
    const user = await getCurrentUser();

    const result = await AlertModel.deleteOne({
      _id: alertId,
      userId: user.id,
    });

    revalidatePath("/watchlist");
    return {
      success: result.deletedCount > 0,
      message:
        result.deletedCount > 0
          ? "Alert deleted successfully."
          : "Alert not found.",
    };
  } catch (error) {
    console.error("Error deleting alert:", error);
    return { success: false, message: "Failed to delete alert." };
  }
};

const shouldTriggerAlert = (
  alertType: AlertType,
  currentPrice: number,
  threshold: number,
) =>
  alertType === "upper" ? currentPrice >= threshold : currentPrice <= threshold;

const canNotifyAgain = (alert: AlertItem) => {
  if (!alert.lastTriggeredAt) return true;
  if (alert.frequency === "once") return false;

  const elapsed = Date.now() - alert.lastTriggeredAt.getTime();
  const minimumDelay =
    alert.frequency === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  return elapsed >= minimumDelay;
};

export const checkAndSendTriggeredAlerts = async () => {
  await connectToDatabase();

  const alerts = await AlertModel.find({ isActive: true });
  const triggeredAlerts = [];

  for (const alert of alerts) {
    if (!canNotifyAgain(alert)) continue;

    try {
      const stockData = await getStocksDetails(alert.symbol);
      if (!stockData?.currentPrice) continue;

      if (
        !shouldTriggerAlert(
          alert.alertType,
          stockData.currentPrice,
          alert.threshold,
        )
      ) {
        continue;
      }
      // Optimistically update before sending email
      const previousLastTriggered = alert.lastTriggeredAt;
      alert.lastTriggeredAt = new Date();
      if (alert.frequency === "once") alert.isActive = false;
      await alert.save();

      try {
        await sendStockAlertEmail({
          email: alert.userEmail,
          symbol: alert.symbol,
          company: alert.company,
          alertType: alert.alertType,
          currentPrice: formatPrice(stockData.currentPrice),
          targetPrice: formatPrice(alert.threshold),
          timestamp: new Date().toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }),
        });
      } catch (emailError) {
        // Rollback on email failure
        alert.lastTriggeredAt = previousLastTriggered;
        if (alert.frequency === "once") alert.isActive = true;
        await alert.save();
        throw emailError;
      }

      triggeredAlerts.push({
        id: alert._id.toString(),
        symbol: alert.symbol,
        currentPrice: stockData.currentPrice,
        threshold: alert.threshold,
      });
    } catch (error) {
      console.error(`Error checking alert ${alert._id.toString()}:`, error);
    }
  }

  return {
    success: true,
    checked: alerts.length,
    triggered: triggeredAlerts.length,
    triggeredAlerts,
  };
};
