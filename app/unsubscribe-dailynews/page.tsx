import { unsubscribeDailyNewsByEmail } from "@/lib/actions/email-subscription.actions";
import { verifyUnsubscribeToken } from "@/lib/email-subscription-links";
import Link from "next/link";
import Image from "next/image";
import {
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
} from "@tabler/icons-react";

type SubscriptionPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function UnsubscribeDailyNewsPage({
  searchParams,
}: SubscriptionPageProps) {
  const { token = "" } = await searchParams;

  let verifiedEmail = "";
  let result = { success: false, message: "Missing unsubscribe token." };

  if (token) {
    try {
      // Verify the token on the server before any unsubscribe mutation runs.
      // This ensures the page never trusts a raw email query parameter.
      verifiedEmail = verifyUnsubscribeToken(token);
      result = await unsubscribeDailyNewsByEmail(verifiedEmail, token);
    } catch (error) {
      // Log the internal failure for diagnostics, but return a safe message to
      // the browser so tampered or expired links do not leak details.
      console.error("Failed to verify unsubscribe token:", error);
      result = {
        success: false,
        message: "Invalid or expired unsubscribe link.",
      };
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-125">
        {/* Logo Area */}
        <div className="mb-8 text-center">
          <Image
            src="https://ik.imagekit.io/tvaz27dnm/logo.svg?updatedAt=1774272106870"
            alt="StockPilot"
            width={160}
            height={40}
            className="h-10 sm:h-12 w-auto mx-auto"
            priority
          />
        </div>

        {/* Main Card */}
        <div className="bg-[#111113] border border-white/6 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/40">
          {/* Status Icon */}
          <div className="mb-8">
            {result.success ? (
              <div className="w-12 h-12 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 flex items-center justify-center mb-6">
                <IconCheck className="w-6 h-6 text-[#34c759]" stroke={2.5} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#ff9500]/10 border border-[#ff9500]/20 flex items-center justify-center mb-6">
                <IconAlertTriangle
                  className="w-6 h-6 text-[#ff9500]"
                  stroke={2.5}
                />
              </div>
            )}

            <h1 className="text-[24px] font-semibold text-white leading-tight tracking-[-0.02em]">
              {result.success
                ? "Successfully unsubscribed"
                : "Unable to update preferences"}
            </h1>
          </div>

          {/* Message */}
          <p className="text-[15px] text-[#98989e] leading-relaxed mb-8">
            {result.message}
          </p>

          {/* Show the verified email only after the signed token has passed. */}
          {result.success && verifiedEmail && (
            <div className="bg-[#1a1a1d] border border-white/4 rounded-2xl p-5 mb-8">
              <p className="text-[12px] text-[#6e6e73] font-medium mb-1.5 uppercase tracking-wide">
                Unsubscribed Email
              </p>
              <p className="text-[15px] text-white font-mono tracking-tight">
                {verifiedEmail}
              </p>
            </div>
          )}

          {/* Information Section */}
          <div className="border-t border-white/6 pt-6 mb-8">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-[#1a1a1d] border border-white/4 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-[#6e6e73]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-[14px] text-[#98989e] leading-relaxed">
                You can re-enable daily market summaries anytime from{" "}
                <span className="text-white font-medium">Profile Settings</span>{" "}
                in your dashboard.
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <Link
            href="https://stockpilotpro.vercel.app/sign-in"
            className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-black py-3.5 px-6 rounded-xl text-lg font-semibold hover:bg-yellow-400 transition-all duration-200 shadow-lg shadow-yellow-500/20"
          >
            Return to StockPilot
            <IconArrowRight className="w-4 h-4" stroke={2.5} />
          </Link>

          {/* Secondary Link */}
          <div className="mt-5 text-center">
            <Link
              href="https://stockpilotpro.vercel.app/"
              className="text-[14px] text-[#78787c] hover:text-white transition-colors duration-200"
            >
              Go to homepage
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[13px] text-[#6e6e73]">
          StockPilot — Intelligent Market Insights Platform
        </p>
      </div>
    </main>
  );
}
