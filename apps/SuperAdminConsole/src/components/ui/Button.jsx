const VARIANTS = {
  primary: "bg-primary text-primary-content hover:shadow-sm",
  secondary: "border border-base-300 bg-transparent text-base-content hover:bg-base-200",
  destructive: "border border-error bg-transparent text-error hover:bg-error hover:text-error-content",
  ghost: "text-base-content/70 hover:bg-base-200",
};

const SIZES = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
