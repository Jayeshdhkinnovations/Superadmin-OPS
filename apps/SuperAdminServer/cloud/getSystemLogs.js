import { requireSuperAdmin } from './authGuard.js';

// Called from the cloud-function error wrapper in main.js (catches every
// thrown error automatically) plus a few explicit call sites for
// success-level events (company created, deleted, etc.) - same append-only
// pattern as writeAuditLog, but for platform/technical events rather than
// Super Admin actions.
//
// Never let a logging failure mask the real error/response: every call site
// wraps this in .catch(() => {}).
export async function writeSystemLog({
  level,
  route,
  message,
  companyName,
  statusCode,
  errorCode,
  meta,
  stack,
}) {
  const SystemLog = Parse.Object.extend('SystemLog');
  const entry = new SystemLog();
  entry.set('level', level);
  entry.set('route', route);
  entry.set('message', message);
  if (companyName) entry.set('companyName', companyName);
  if (statusCode != null) entry.set('statusCode', statusCode);
  if (errorCode != null) entry.set('errorCode', errorCode);
  // Passwords/tokens/cookies/raw IPs must never end up in here - callers are
  // responsible for only passing safe fields into meta.
  if (meta) entry.set('meta', meta);
  if (stack) entry.set('stack', stack);
  await entry.save(null, { useMasterKey: true });
}

export default async function getSystemLogs(request) {
  requireSuperAdmin(request);

  // The console's Logs page sends `company` and `message` (matching what's
  // shown in its two search boxes) - also accept `route`/`search` since
  // those are the more literal field names, in case another caller uses them.
  const {
    level,
    from,
    to,
    route,
    search,
    company,
    message,
    page = 0,
    limit = 50,
  } = request.params || {};

  const query = new Parse.Query('SystemLog');
  if (level && level !== 'all') query.equalTo('level', level);
  if (from) query.greaterThanOrEqualTo('createdAt', new Date(from));
  if (to) query.lessThanOrEqualTo('createdAt', new Date(to));
  if (route) query.matches('route', route, 'i');
  if (search || message) query.matches('message', search || message, 'i');
  if (company) query.matches('companyName', company, 'i');
  query.descending('createdAt');
  // Never let a caller request an unbounded page - clamp to a sane max.
  query.skip(page * Math.min(limit, 200));
  query.limit(Math.min(limit, 200));

  const [logs, total] = await Promise.all([
    query.find({ useMasterKey: true }),
    query.count({ useMasterKey: true }),
  ]);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    logs: logs.map((l) => {
      const json = l.toJSON();
      if (isProduction) delete json.stack;
      return json;
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
