export default function StatBar({ items }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
        >
          <p className="text-xs font-semibold tracking-wide text-base-content/60 uppercase">
            {item.label}
          </p>
          <p className="text-2xl font-semibold text-base-content">{item.value}</p>
          {item.sublabel && <p className="text-xs text-base-content/50">{item.sublabel}</p>}
        </div>
      ))}
    </div>
  );
}
