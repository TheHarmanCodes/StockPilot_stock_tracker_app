import crypto from "crypto";
import { APP_BASE_URL } from "@/lib/constants";

type EmailLinkAction = "unsubscribe" | "resubscribe";

type EmailLinkTokenPayload = {
  email: string;
  action: EmailLinkAction;
  expiresAt: number;
};

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Reuse the app's existing secret when a dedicated email-link secret is not set.
// This keeps the link tokens signed without introducing a separate dependency.
const getSigningSecret = () =>
  process.env.EMAIL_LINK_TOKEN_SECRET ??
  process.env.BETTER_AUTH_SECRET ??
  "";

const createSignature = (payload: string) => {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error("Missing email link signing secret.");
  }

  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
};

const safeEquals = (expected: string, actual: string) => {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
};

const encodePayload = (payload: EmailLinkTokenPayload) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const decodePayload = (encodedPayload: string) =>
  JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as EmailLinkTokenPayload;

export const buildEmailSubscriptionToken = (
  email: string,
  action: EmailLinkAction,
) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  // The token payload carries the target email, the intended action, and an
  // absolute expiration time so the link cannot be reused forever.
  const payload = {
    email: normalizedEmail,
    action,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${createSignature(encodedPayload)}`;
};

const verifyEmailSubscriptionToken = ({
  token,
  action,
  email,
}: {
  token: string;
  action: EmailLinkAction;
  email?: string;
}) => {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    throw new Error("Missing token.");
  }

  const [encodedPayload = "", signature = ""] = trimmedToken.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid or expired link.");
  }

  let payload: EmailLinkTokenPayload;

  try {
    // Decode the payload only after basic shape checks so malformed input
    // fails fast without reaching the subscription update logic.
    payload = decodePayload(encodedPayload);
  } catch {
    throw new Error("Invalid or expired link.");
  }

  // Enforce the action first so an unsubscribe token cannot be replayed on the
  // resubscribe route, or vice versa.
  if (payload.action !== action) {
    throw new Error("Invalid or expired link.");
  }

  // Reject stale links before touching the database.
  if (typeof payload.expiresAt !== "number" || Date.now() >= payload.expiresAt) {
    throw new Error("Invalid or expired link.");
  }

  // Verify the signature over the original payload so any tampering breaks the
  // HMAC check and the request is rejected.
  const expectedSignature = createSignature(encodedPayload);
  if (!safeEquals(expectedSignature, signature)) {
    throw new Error("Invalid or expired link.");
  }

  const normalizedEmail = normalizeEmail(payload.email);
  if (!normalizedEmail) {
    throw new Error("Invalid or expired link.");
  }

  if (email && normalizedEmail !== normalizeEmail(email)) {
    // Extra defense-in-depth: the page/action passes the resolved email back in
    // here so the link must match the account it is about to update.
    throw new Error("Invalid or expired link.");
  }

  return normalizedEmail;
};

export const verifyUnsubscribeToken = (token: string) =>
  verifyEmailSubscriptionToken({ token, action: "unsubscribe" });

export const verifyResubscribeToken = (token: string) =>
  verifyEmailSubscriptionToken({ token, action: "resubscribe" });

export const verifyUnsubscribeTokenForEmail = (email: string, token: string) =>
  verifyEmailSubscriptionToken({ token, action: "unsubscribe", email });

export const verifyResubscribeTokenForEmail = (email: string, token: string) =>
  verifyEmailSubscriptionToken({ token, action: "resubscribe", email });

export const buildUnsubscribeDailyNewsUrl = (email: string) => {
  const token = buildEmailSubscriptionToken(email, "unsubscribe");
  // Email footers now point at the signed token route instead of exposing the
  // recipient address in the query string.
  return `${APP_BASE_URL}/unsubscribe-dailynews?token=${encodeURIComponent(token)}`;
};

export const buildResubscribeDailyNewsUrl = (email: string) => {
  const token = buildEmailSubscriptionToken(email, "resubscribe");
  // Resubscribe links use the same signed-token pattern for consistency and
  // to keep both actions protected by expiry and signature checks.
  return `${APP_BASE_URL}/resubscribe-dailynews?token=${encodeURIComponent(token)}`;
};
