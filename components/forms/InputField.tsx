import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

const InputField = ({
  name,
  label,
  placeholder,
  register,
  error,
  type = "text",
  validation,
  disabled = false,
  value,
  autoComplete,
  rightElement,
  children,
}: FormInputProps) => {
  const endAdornment = rightElement || children;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <div className="relative">
        <Input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          id={name}
          autoComplete={autoComplete}
          className={cn("form-input", {
            "opacity-50 cursor-not-allowed": disabled,
            "pr-10": !!endAdornment,
          })}
          {...register(name, validation)}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default InputField;
