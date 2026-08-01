import { openSignInternalUrl, openSignInternalAdminSecret } from '../Utils.js';
import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';

export default async function reactivateCompany(request) {
  requireSuperAdmin(request);

  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const company = await new Parse.Query('Company').get(id, { useMasterKey: true });
  const before = company.toJSON();

  // Since suspend never actually removes the live mount (see
  // suspendCompany.js's note), this call is normally a harmless no-op -
  // mountCompany() already returns { alreadyMounted: true } instead of
  // re-mounting. It matters for the case where the OpenSign container
  // restarted while this company was suspended, since only *active*
  // companies get auto-remounted on startup (see multiTenant.js).
  const mountRes = await fetch(`${openSignInternalUrl}/admin/mount-company`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': openSignInternalAdminSecret,
    },
    body: JSON.stringify({ slug: company.get('subdomain'), databaseName: company.get('databaseName') }),
  }).then((r) => r.json());
  if (mountRes.error) throw new Error(`Failed remounting company on OpenSign: ${mountRes.error}`);

  company.set('status', 'active');
  await company.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'company.reactivate',
    targetId: id,
    before,
    after: company.toJSON(),
  });

  await writeSystemLog({
    level: 'info',
    route: 'functions/reactivatecompany',
    message: `Company "${company.get('companyName')}" reactivated.`,
    companyName: company.get('companyName'),
  }).catch(() => {});

  return company.toJSON();
}
