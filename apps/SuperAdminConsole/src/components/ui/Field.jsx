export default function Field({ label, htmlFor, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-base-content">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
