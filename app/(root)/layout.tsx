import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { getCurrentUserDailyNewsSubscriptionStatus } from "@/lib/actions/email-subscription.actions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import Footer from "@/components/Footer";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth?.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  // The header dropdown needs the latest subscription state to show the right action.
  const isDailyNewsSubscribed =
    await getCurrentUserDailyNewsSubscriptionStatus(session.user.email);

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <main className="min-h-screen text-gray-400">
      <Header user={user} isDailyNewsSubscribed={isDailyNewsSubscribed} />
      <div className="container py-10">{children}</div>
      <Footer />
    </main>
  );
};

export default Layout;
