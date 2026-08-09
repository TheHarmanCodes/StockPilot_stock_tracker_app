import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/database/mongoose";

export const requireVerifiedUser = async () => {
  const session = await auth?.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check email verification status
  // We check the database directly to ensure we have the latest status
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection failed");
  }

  const userDoc = await db.collection("user").findOne({ email: session.user.email });
  
  if (!userDoc || userDoc.emailVerified !== true) {
    // In a server action, redirecting to root where the EmailVerification modal
    // will be shown is a reasonable fallback, or we could throw a specific error.
    // The issue asks to "Enforce email verification", redirecting to home 
    // where they are forced to verify seems appropriate.
    redirect("/");
  }

  return session.user;
};
