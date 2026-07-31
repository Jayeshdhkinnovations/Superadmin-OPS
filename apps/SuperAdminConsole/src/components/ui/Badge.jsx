const VARIANTS = {
  active: "bg-success/20 text-success",
  suspended: "bg-warning/20 text-warning",
  provisioning: "bg-info/20 text-info",
  failed: "bg-error/20 text-error",
  info: "bg-info/20 text-info",
  warn: "bg-warning/20 text-warning",
  error: "bg-error/20 text-error",
  neutral: "bg-base-300 text-base-content/70",
};

export default function Badge({
  variant = "neutral",
  children,
  dot = true,
  icon: Icon,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
    >
      {Icon ? (
        <Icon size={13} className="shrink-0" />
      ) : (
        dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
