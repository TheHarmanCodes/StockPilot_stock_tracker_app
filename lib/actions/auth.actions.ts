"use server";

import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";
import { ensureEmailSubscriptionRecord } from "./email-subscription.actions";
import { connectToDatabase } from "@/database/mongoose";
import OTPModel from "@/database/models/otp.model";
import { sendOTPEmail } from "../nodemailer";
import {randomInt} from "node:crypto";

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
      try {
        await ensureEmailSubscriptionRecord({
          userId: response.user.id,
          email,
          source: "sign_up",
        });
      } catch (subError) {
        console.error("Subscription record creation failed", subError);
        // We don't necessarily want to fail the whole sign up if only subscription fails
      }

      try {
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
      } catch (inngestError) {
        console.error("Inngest event send failed", inngestError);
        // We don't necessarily want to fail the whole sign up if only inngest fails
      }

      // Automatically trigger the first OTP after user creation
      // We do this here instead of EmailVerification useEffect to have more control
      // and ensure it happens after user is successfully created in DB.
      try {
        await sendVerificationOTP(email);
      } catch (otpError) {
        console.error("Initial OTP send failed", otpError);
      }
    }
    return { success: true, data: response };
  } catch (e) {
    console.error("Sign up failed (detailed):", e);
    return { success: false, error: e instanceof Error ? e.message : "Sign up failed" };
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

export const sendVerificationOTP = async (email: string) => {
  try {
    await connectToDatabase();

    // Check if an OTP was recently sent (throttle)
    const existingOTP = await OTPModel.findOne({
      email,
      createdAt: { $gt: new Date(Date.now() - 300000) }, // 5-minute throttle
    });

    if (existingOTP) {
      return {
        success: false,
        error: "Please wait before requesting a new code.",
      };
    }

    // Generate 6-digit OTP
    const otp = randomInt(100000, 1_000_000).toString();

    // Save to DB (update if exists, otherwise create)
    await OTPModel.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true },
    );

    // Send Email
    await sendOTPEmail({ email, otp });

    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP", error);
    return { success: false, error: "Failed to send verification code" };
  }
};

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const otpRecord = await OTPModel.findOne({ email, otp });

    if (!otpRecord) {
      return { success: false, error: "Invalid or expired verification code" };
    }

    // Update user verified status
    const result = await db.collection("user").updateOne(
      { email },
      { $set: { emailVerified: true } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "User not found" };
    }

    // Delete the OTP after successful verification
    await OTPModel.deleteOne({ _id: otpRecord._id });

    return { success: true };
  } catch (error) {
    console.error("Verification failed", error);
    return { success: false, error: "Verification failed" };
  }
};
