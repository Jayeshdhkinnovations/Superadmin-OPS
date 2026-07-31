import { forwardRef } from "react";

const Input = forwardRef(function Input({ className = "", invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-10 w-full rounded-xl border bg-base-100 px-3 text-sm text-base-content placeholder:text-base-content/40 transition-colors focus:outline-none focus:ring-4 ${
        invalid
          ? "border-error focus:ring-error/10"
          : "border-base-300 focus:border-primary focus:ring-primary/10"
      } ${className}`}
      {...props}
    />
  );
});

export default Input;
