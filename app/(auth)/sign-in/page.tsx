"use client";

import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/ui/textRevealAnimation";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignIn = () => {
  const router = useRouter();
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
    try {
      const result = await signInWithEmail(data);
      if (result.success) {
        router.push("/");
      }
    } catch (e) {
      console.log(e);
      toast.error("Sign in failed", {
        description: e instanceof Error ? e.message : "Failed to sing in",
      });
    }
  };

  return (
    <>
      <div className=" lg:px-14 lg:mt-15 ">
        <h1 className="text-3xl font-medium text-gray-400 mb-10">
          <div className="flex items-center gap-2">
            <TextReveal word="Login" />
            <TextReveal word="Your" />
            <TextReveal word="Account" />
          </div>
        </h1>
        <form
          action=""
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-7 "
          method="POST"
        >
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
            type="password"
            validation={{
              required: "Password is required",
              minLength: 8,
            }}
          />

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
