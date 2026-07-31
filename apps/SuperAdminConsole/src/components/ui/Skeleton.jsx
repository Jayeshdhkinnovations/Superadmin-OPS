export function SkeletonLine({ className = "" }) {
  return <div className={`animate-pulse rounded bg-base-300 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-base-300 bg-base-200 p-5 shadow-sm">
      <SkeletonLine className="mb-3 h-3 w-24" />
      <SkeletonLine className="h-7 w-16" />
    </div>
  );
}

export function SkeletonRow({ columns = 5 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine className="h-4 w-full max-w-40" />
        </td>
      ))}
    </tr>
  );
}
