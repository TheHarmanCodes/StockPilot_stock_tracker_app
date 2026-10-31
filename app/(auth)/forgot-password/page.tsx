"use client";

import { useState, useEffect } from "react";
import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/ui/textRevealAnimation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  sendForgotPasswordOTP,
  resetPasswordWithOTP,
} from "@/lib/actions/auth.actions";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const ForgotPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form for Step 1: Email
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors, isSubmitting: isSubmittingEmail },
  } = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  // Form for Step 2: New Password
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    getValues,
    formState: { errors: resetErrors, isSubmitting: isSubmittingReset },
  } = useForm<{
    newPassword: string;
    confirmPassword: string;
  }>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSendEmail = async (data: { email: string }) => {
    const targetEmail = data.email.trim();
    setIsSending(true);
    try {
      const result = await sendForgotPasswordOTP(targetEmail);
      if (result.success) {
        setEmail(targetEmail);
        setStep("reset");
        setCountdown(120);
        toast.success("Verification code sent to your email!");
      } else {
        toast.error("Failed to send code", {
          description:
            result.error || "Please check your email address and try again.",
        });
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0 || isSending) return;
    setIsSending(true);
    try {
      const result = await sendForgotPasswordOTP(email);
      if (result.success) {
        setCountdown(120);
        toast.success("New verification code sent!");
      } else {
        toast.error(result.error || "Failed to resend code");
      }
    } catch {
      toast.error("An error occurred while resending code.");
    } finally {
      setIsSending(false);
    }
  };

  const onResetPassword = async (data: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (otp.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code");
      return;
    }
    setOtpError("");

    try {
      const result = await resetPasswordWithOTP({
        email,
        otp,
        newPassword: data.newPassword,
      });

      if (result.success) {
        setStep("success");
        toast.success("Password reset successfully!");
      } else {
        toast.error("Password reset failed", {
          description:
            result.error || "Invalid or expired code. Please try again.",
        });
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="lg:px-14 lg:mt-15">
      <h1 className="text-3xl font-medium text-gray-400 mb-8">
        <div className="hidden sm:flex items-center gap-2">
          <TextReveal word="Reset" />
          <TextReveal word="Your" />
          <TextReveal word="Password" />
        </div>
        <span className="block sm:hidden form-title">Reset Your Password</span>
      </h1>

      {step === "email" && (
        <>
          <p className="text-gray-400 text-sm mb-6">
            Enter the email address linked to your account, and we&apos;ll send
            you a 6-digit verification code to reset your password.
          </p>

          <form onSubmit={handleSubmitEmail(onSendEmail)} className="space-y-6">
            <InputField
              name="email"
              label="Email Address"
              placeholder="Enter your registered email"
              register={registerEmail}
              error={emailErrors.email}
              autoComplete="email"
              validation={{
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message:
                    "Please enter a valid email (e.g., name@example.com).",
                },
              }}
            />

            <Button
              type="submit"
              disabled={isSubmittingEmail || isSending}
              className="yellow-btn w-full mb-2"
            >
              {isSubmittingEmail || isSending
                ? "Sending Code..."
                : "Send Verification Code"}
            </Button>

            <FooterLink
              text="Remember your password?"
              linkText="Sign In"
              href="/sign-in"
            />
          </form>
        </>
      )}

      {step === "reset" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-gray-600/60">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Verification for
              </p>
              <p className="text-sm font-medium text-yellow-500 truncate max-w-[240px] sm:max-w-xs">
                {email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setOtpError("");
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Change
            </button>
          </div>

          <form
            onSubmit={handleSubmitReset(onResetPassword)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="form-label block">Enter 6-digit Code</label>
              <div className="flex justify-center sm:justify-start">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (otpError) setOtpError("");
                  }}
                  autoFocus
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot
                      index={0}
                      className="size-11 sm:size-12 text-lg sm:text-xl rounded-md border text-white"
                    />
                    <InputOTPSlot
                      index={1}
                      className="size-11 sm:size-12 text-lg sm:text-xl rounded-md border text-white"
                    />
                    <InputOTPSlot
                      index={2}
                      className="size-11 sm:size-12 text-lg sm:text-xl rounded-md border text-white"
                    />
                    <InputOTPSlot
                      index={3}
                      className="size-11 sm:size-12 text-lg sm:text-xl rounded-md border text-white"
                    />
                    <InputOTPSlot
                      index={4}
                      className="size-11 sm:size-12 text-lg sm:text-xl rounded-md border text-white"
                    />
                    <InputOTPSlot
                      index={5}
                      className="size-11 sm:size-12 text-lg sm:text-xl rounded-md border text-white"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {otpError && <p className="text-sm text-red-500">{otpError}</p>}
            </div>

            <InputField
              name="newPassword"
              label="New Password"
              placeholder="Enter new password (min. 8 characters)"
              register={registerReset}
              error={resetErrors.newPassword}
              type={showPassword ? "text" : "password"}
              validation={{
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              }}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              }
            />

            <InputField
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              register={registerReset}
              error={resetErrors.confirmPassword}
              type={showConfirmPassword ? "text" : "password"}
              validation={{
                required: "Please confirm your password",
                validate: (val: string) =>
                  val === getValues("newPassword") || "Passwords do not match",
              }}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              }
            />

            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-2.5 text-xs text-yellow-500/90">
              <AlertTriangle className="size-4 shrink-0 text-yellow-500" />
              <span>
                Check your mailbox spam tab or junk folder if you don&apos;t see
                the email.
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isSending}
                className="text-yellow-500 hover:text-yellow-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0
                  ? `Resend in ${countdown}s`
                  : isSending
                    ? "Sending..."
                    : "Resend Code"}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmittingReset || otp.length !== 6}
              className="yellow-btn w-full mt-2"
            >
              {isSubmittingReset ? "Resetting Password..." : "Reset Password"}
            </Button>

            <FooterLink
              text="Return to login?"
              linkText="Sign In"
              href="/sign-in"
            />
          </form>
        </div>
      )}

      {step === "success" && (
        <div className="text-center py-6 space-y-6">
          <div className="size-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-500">
            <CheckCircle2 className="size-8 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Password Reset Successful
            </h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Your password has been successfully updated. You can now use your
              new password to log in.
            </p>
          </div>

          <Button
            onClick={() => router.push("/sign-in")}
            className="yellow-btn w-full"
          >
            Sign In Now
          </Button>

          <div className="pt-2">
            <Link
              href="/sign-in"
              className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
