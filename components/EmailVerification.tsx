"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { sendVerificationOTP, verifyOTP } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface EmailVerificationProps {
  email: string;
}

const EmailVerification = ({ email }: EmailVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isInvalid, setIsInvalid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    setIsSending(true);
    try {
      const result = await sendVerificationOTP(email);
      if (result.success) {
        toast.success("Verification code sent to your email");
        setCountdown(300); // 5 minutes cooldown
        localStorage.setItem(`otp_sent_${email}`, Date.now().toString());
      } else {
        toast.error(result.error || "Failed to send code");
        if (result.error?.includes("wait")) {
          // If they already have an active OTP, we don't know the exact remaining time, 
          // but we'll set a reasonable cooldown.
          setCountdown(60); 
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    // Check if we should trigger an initial OTP
    const lastSent = localStorage.getItem(`otp_sent_${email}`);
    const now = Date.now();
    
    if (!lastSent || now - parseInt(lastSent) > 300000) {
      handleSendOTP();
      localStorage.setItem(`otp_sent_${email}`, now.toString());
    } else {
      // Set remaining countdown
      const remaining = Math.ceil((300000 - (now - parseInt(lastSent))) / 1000);
      setCountdown(remaining);
    }
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsSubmitting(true);
    setIsInvalid(false);
    try {
      const result = await verifyOTP(email, otp);
      if (result.success) {
        toast.success("Email verified successfully!");
        router.refresh();
      } else {
        setIsInvalid(true);
        toast.error(result.error || "Verification failed");
      }
    } catch (error) {
      setIsInvalid(true);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="bg-[#141414] border border-[#30333A] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-yellow-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-yellow-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
          <p className="text-gray-400">
            We've sent a 6-digit verification code to <br />
            <span className="text-gray-200 font-medium">{email}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (isInvalid) setIsInvalid(false);
              }}
              onComplete={handleVerify}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="size-12 lg:size-14 text-xl lg:text-2xl rounded-md border" aria-invalid={isInvalid}/>
                <InputOTPSlot index={1} className="size-12 lg:size-14 text-xl lg:text-2xl rounded-md border" aria-invalid={isInvalid}/>
                <InputOTPSlot index={2} className="size-12 lg:size-14 text-xl lg:text-2xl rounded-md border" aria-invalid={isInvalid}/>
                <InputOTPSlot index={3} className="size-12 lg:size-14 text-xl lg:text-2xl rounded-md border" aria-invalid={isInvalid}/>
                <InputOTPSlot index={4} className="size-12 lg:size-14 text-xl lg:text-2xl rounded-md border" aria-invalid={isInvalid}/>
                <InputOTPSlot index={5} className="size-12 lg:size-14 text-xl lg:text-2xl rounded-md border" aria-invalid={isInvalid}/>
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isSubmitting || otp.length !== 6}
            className="w-full py-6 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black border-none rounded-xl disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
          <button
            onClick={handleSendOTP}
            disabled={isSending || countdown > 0}
            className="text-yellow-500 font-medium hover:text-yellow-400 transition-colors"
          >
            {countdown > 0
              ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
              : isSending
              ? "Sending..."
              : "Resend Verification Code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
