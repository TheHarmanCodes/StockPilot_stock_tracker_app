"use client";

import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/ui/textRevealAnimation";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "IN",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    const result = await signUpWithEmail(data);
    if (result.success) {
      router.push("/");
    } else {
      toast.error("Sign up failed", {
        description: result.error || "Failed to create an account",
      });
    }
  };
  return (
    <>
      <h1 className="form-title">
        <div className="flex items-center gap-2">
          <TextReveal word="Sign" />
          <TextReveal word="Up" />
          <TextReveal word="&" />
          <TextReveal word="Personalize" />
        </div>
        {/* Sign Up & Personalize */}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="fullName"
          label="Full Name"
          placeholder="John Doe"
          register={register}
          error={errors.fullName}
          validation={{ required: "Full name is required", minLength: 2 }}
        />

        <InputField
          name="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
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

        <CountrySelectField
          label="Country"
          name="country"
          control={control}
          error={errors.country}
          required
        />

        <InputField
          name="password"
          label="Password"
          placeholder="Enter a strong password"
          register={register}
          error={errors.password}
          type="password"
          validation={{
            required: "Password is required",
            pattern: {
              value:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+|\\:;"'<>,./~`])[A-Za-z\d@$!%*?&^#()[\]{}\-_=+|\\:;"'<>,./~`]{8,32}$/,
              message:
                "Password must include uppercase, lowercase, number, and special character (8–32 characters).",
            },
          }}
        />

        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select your risk level"
          control={control}
          error={errors.riskTolerance}
          options={RISK_TOLERANCE_OPTIONS}
          required
        />

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investment goal"
          control={control}
          error={errors.investmentGoals}
          options={INVESTMENT_GOALS}
          required
        />

        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          control={control}
          error={errors.preferredIndustry}
          options={PREFERRED_INDUSTRIES}
          required
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5 "
        >
          {isSubmitting ? "Creating account" : "Start Your Investing Journey"}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign In"
          href="/sign-in"
        />
      </form>
    </>
  );
};

export default SignUp;
