"use client";

import { useState } from "react";
import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/ui/textRevealAnimation";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignIn = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    const result = await signInWithEmail(data);

    if (result.success) {
      router.push("/");
    } else {
      toast.error("Sign in failed", {
        description: result.error || "Failed to sign in",
      });
    }
  };

  return (
    <>
      <div className=" lg:px-14 lg:mt-15 ">
        <h1 className="text-3xl font-medium text-gray-400 mb-10">
          <div className="hidden sm:flex items-center gap-2">
            <TextReveal word="Login" />
            <TextReveal word="Your" />
            <TextReveal word="Account" />
          </div>
          <span className="block sm:hidden form-title">Login Your Account</span>
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 ">
          <InputField
            name="email"
            label="Email"
            placeholder="Enter your email"
            register={register}
            error={errors.email}
            autoComplete="email"
            validation={{
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Please enter a valid email (e.g., name@example.com).",
              },
            }}
          />

          <InputField
            name="password"
            label="Password"
            placeholder="Enter your password"
            register={register}
            error={errors.password}
            type={showPassword ? "text" : "password"}
            validation={{
              required: "Password is required",
              minLength: 8,
            }}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-5" />
                ) : (
                  <EyeIcon className="size-5" />
                )}
              </button>
            }
          />

          <div className="flex items-center justify-end -mt-3">
            <Link
              href="/forgot-password"
              className="text-xs text-yellow-500 hover:text-yellow-400 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="yellow-btn w-full mb-2"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

          <FooterLink
            text="Don’t have an account?"
            linkText="Sign Up"
            href="/sign-up"
          />
        </form>
      </div>
    </>
  );
};

export default SignIn;
