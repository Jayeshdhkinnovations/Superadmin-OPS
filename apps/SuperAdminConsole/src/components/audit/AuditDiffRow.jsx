export default function AuditDiffRow({ log, columns }) {
  const before = log.before || {};
  const after = log.after || {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return (
    <tr className="bg-base-200/60">
      <td colSpan={columns} className="px-4 py-4">
        {keys.length === 0 ? (
          <p className="text-sm text-base-content/50">No field-level change data for this entry.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="pr-4 pb-2 font-semibold tracking-wide text-base-content/50 uppercase">
                  Field
                </th>
                <th className="pr-4 pb-2 font-semibold tracking-wide text-base-content/50 uppercase">
                  Before
                </th>
                <th className="pb-2 font-semibold tracking-wide text-base-content/50 uppercase">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300/70">
              {keys.map((key) => {
                const changed = JSON.stringify(before[key]) !== JSON.stringify(after[key]);
                return (
                  <tr key={key}>
                    <td className="py-2 pr-4 font-mono text-base-content/70">{key}</td>
                    <td
                      className={`py-2 pr-4 font-mono ${changed ? "text-error line-through" : "text-base-content/60"}`}
                    >
                      {before[key] === undefined ? "—" : String(before[key])}
                    </td>
                    <td
                      className={`py-2 font-mono ${changed ? "font-semibold text-success" : "text-base-content/60"}`}
                    >
                      {after[key] === undefined ? "—" : String(after[key])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}
