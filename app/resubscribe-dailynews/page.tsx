import { subscribeDailyNewsByEmail } from "@/lib/actions/email-subscription.actions";
import { verifyResubscribeToken } from "@/lib/email-subscription-links";
import Link from "next/link";

type SubscriptionPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResubscribeDailyNewsPage({
  searchParams,
}: SubscriptionPageProps) {
  // This page is opened from a resubscribe link and restores the user's daily email preference.
  const { token = "" } = await searchParams;

  let verifiedEmail = "";
  let result = { success: false, message: "Missing resubscribe token." };

  if (token) {
    try {
      // The resubscribe route uses the same signed-token check so only the
      // intended recipient can restore the subscription state.
      verifiedEmail = verifyResubscribeToken(token);
      result = await subscribeDailyNewsByEmail(verifiedEmail, token);
    } catch (error) {
      // Keep the response generic so expired or modified links fail safely.
      console.error("Failed to verify resubscribe token:", error);
      result = {
        success: false,
        message: "Invalid or expired resubscribe link.",
      };
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-gray-100 flex items-center justify-center px-6">
      <section className="w-full max-w-lg rounded-2xl border border-gray-800 bg-[#141414] p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-yellow-500">
          StockPilot
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          {result.success
            ? "Daily summary resubscribed"
            : "We could not update your preference"}
        </h1>
        <p className="mt-3 text-gray-400">{result.message}</p>
        <p className="mt-6 text-sm text-gray-500">
          {result.success
            ? "Your next daily market news summary will be delivered on schedule."
            : "Please retry from the latest email link or contact support if this persists."}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-yellow-500 px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-yellow-400"
        >
          Open dashboard
        </Link>
      </section>
    </main>
  );
}
