import { openSignInternalUrl, openSignInternalAdminSecret } from '../Utils.js';
import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';

export default async function suspendCompany(request) {
  requireSuperAdmin(request);

  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const company = await new Parse.Query('Company').get(id, { useMasterKey: true });
  const before = company.toJSON();

  // Enforce suspension by unmounting the company from the shared OpenSign container immediately.
  await fetch(`${openSignInternalUrl}/admin/unmount-company`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': openSignInternalAdminSecret,
    },
    body: JSON.stringify({ slug: company.get('subdomain') }),
  }).catch((err) => {
    console.log(`suspendCompany: failed to unmount "${company.get('subdomain')}": ${err.message}`);
  });

  company.set('status', 'suspended');
  await company.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'company.suspend',
    targetId: id,
    before,
    after: company.toJSON(),
  });

  await writeSystemLog({
    level: 'warn',
    route: 'functions/suspendcompany',
    message: `Company "${before.companyName}" marked suspended (not yet enforced on access).`,
    companyName: before.companyName,
  }).catch(() => {});

  return company.toJSON();
}
