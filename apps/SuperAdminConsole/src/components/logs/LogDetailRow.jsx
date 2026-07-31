export default function LogDetailRow({ log, columns }) {
  const isDev = import.meta.env.DEV;

  return (
    <tr className="bg-base-200/60">
      <td colSpan={columns} className="px-4 py-4">
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold tracking-wide text-base-content/50 uppercase">Message</p>
            <p className="mt-1 text-base-content">{log.message}</p>
          </div>
          {log.errorCode && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-base-content/50 uppercase">
                Error code
              </p>
              <p className="mt-1 font-mono text-xs text-error">{log.errorCode}</p>
            </div>
          )}
          {log.meta && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-base-content/50 uppercase">Meta</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-base-300/50 p-3 text-xs">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            </div>
          )}
          {isDev && log.stack && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-base-content/50 uppercase">
                Stack trace (dev only)
              </p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-base-300/50 p-3 text-xs">{log.stack}</pre>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
