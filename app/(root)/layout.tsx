import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { getCurrentUserDailyNewsSubscriptionStatus } from "@/lib/actions/email-subscription.actions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import Footer from "@/components/Footer";
import EmailVerification from "@/components/EmailVerification";
import { connectToDatabase } from "@/database/mongoose";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth?.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  // Check if user is verified directly from DB to be sure
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  const userDoc = await db?.collection("user").findOne({ email: session.user.email });
  const isEmailVerified = userDoc?.emailVerified === true;

  // The header dropdown needs the latest subscription state to show the right action.
  const isDailyNewsSubscribed =
    await getCurrentUserDailyNewsSubscriptionStatus(session.user.email);

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <main className="flex-1 flex flex-col text-gray-400">
      <Header user={user} isDailyNewsSubscribed={isDailyNewsSubscribed} />
      <div className={`container py-10 flex-1 ${!isEmailVerified ? "blur-sm pointer-events-none select-none" : ""}`}>
        {children}
      </div>
      {!isEmailVerified && <EmailVerification email={session.user.email} />}
      <Footer />
    </main>
  );
};

export default Layout;
