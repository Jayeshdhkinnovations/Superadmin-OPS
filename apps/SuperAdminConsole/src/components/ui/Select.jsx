import { forwardRef } from "react";

// Matches Input's shape exactly so a select and a text field sitting in the
// same Field grid line up. `appearance-none` plus the inline SVG chevron
// because the native arrow can't be recoloured to follow the daisyUI theme.
const Select = forwardRef(function Select({ className = "", invalid = false, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`h-10 w-full appearance-none rounded-xl border bg-base-100 bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22%239CA3AF%22%3E%3Cpath%20d%3D%22M4.5%206.5%208%2010l3.5-3.5z%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-sm text-base-content transition-colors focus:outline-none focus:ring-4 ${
        invalid
          ? "border-error focus:ring-error/10"
          : "border-base-300 focus:border-primary focus:ring-primary/10"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
