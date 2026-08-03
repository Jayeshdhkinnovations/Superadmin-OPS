import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { companyMasterKey, companyAppId } from '../Utils.js';

export default async function updateCompanyLimit(request) {
  requireSuperAdmin(request);

  if (!companyMasterKey) {
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'COMPANY_MASTER_KEY is not configured on SuperAdminServer.');
  }

  const { id, maxUsers } = request.params;
  if (!id || !maxUsers || maxUsers < 1) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id and a positive maxUsers are required.');
  }

  const company = await new Parse.Query('Company').get(id, { useMasterKey: true });
  const before = company.toJSON();

  // Propagate the new limit into the company's OWN Tenant record - this is
  // what addUser.js actually enforces against, not the control-plane's copy.
  const companyServerUrl = `http://localhost:${company.get('port')}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': companyAppId,
    'X-Parse-Master-Key': companyMasterKey,
  };
  const tenantQuery = await fetch(
    `${companyServerUrl}/app/classes/partners_Tenant?where=${encodeURIComponent(JSON.stringify({ TenantName: company.get('companyName') }))}`,
    { headers }
  ).then((r) => r.json());
  const tenant = tenantQuery.results?.[0];
  if (tenant) {
    await fetch(`${companyServerUrl}/app/classes/partners_Tenant/${tenant.objectId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ MaxUsers: maxUsers }),
    });
  }

  company.set('maxUsers', maxUsers);
  await company.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'company.edit',
    targetId: id,
    before,
    after: company.toJSON(),
  });

  return company.toJSON();
}
