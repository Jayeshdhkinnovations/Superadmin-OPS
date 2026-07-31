import { stopCompanyContainer } from '../services/dockerManager.js';
import { pauseRoute } from '../services/proxyManager.js';
import { stopCompanyFrontend } from '../services/frontendManager.js';
import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';

export default async function suspendCompany(request) {
  requireSuperAdmin(request);

  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const company = await new Parse.Query('Company').get(id, { useMasterKey: true });
  const before = company.toJSON();

  // Stops the running instance only - their database is left fully intact.
  await stopCompanyContainer(company.get('containerName'));
  stopCompanyFrontend(company.get('subdomain'));
  await pauseRoute({ subdomain: company.get('subdomain') });

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
    message: `Company "${before.companyName}" suspended - instance stopped.`,
    companyName: before.companyName,
  }).catch(() => {});

  return company.toJSON();
}
