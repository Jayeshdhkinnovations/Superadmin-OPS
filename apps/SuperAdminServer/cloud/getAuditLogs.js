import { requireSuperAdmin } from './authGuard.js';

// Called by every mutating cloud function (create/edit/suspend/reactivate/
// delete company) - never exposed as its own callable endpoint, and there
// is deliberately no update/delete path for AuditLog records anywhere in
// this codebase - append-only, by construction.
export async function writeAuditLog({ actorEmail, action, targetId, before, after }) {
  const AuditLog = Parse.Object.extend('AuditLog');
  const entry = new AuditLog();
  entry.set('actorEmail', actorEmail);
  entry.set('action', action);
  entry.set('targetId', targetId);
  if (before) entry.set('before', before);
  if (after) entry.set('after', after);
  await entry.save(null, { useMasterKey: true });
}

export async function getAuditLogs(request) {
  requireSuperAdmin(request);

  const { actor, action, from, to, page = 0, limit = 50 } = request.params || {};

  const query = new Parse.Query('AuditLog');
  if (actor) query.matches('actorEmail', actor, 'i');
  if (action && action !== 'all') query.equalTo('action', action);
  if (from) query.greaterThanOrEqualTo('createdAt', new Date(from));
  if (to) query.lessThanOrEqualTo('createdAt', new Date(to));
  query.descending('createdAt');
  query.skip(page * limit);
  query.limit(limit);

  const [logs, total] = await Promise.all([
    query.find({ useMasterKey: true }),
    query.count({ useMasterKey: true }),
  ]);

  return {
    logs: logs.map((l) => l.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
