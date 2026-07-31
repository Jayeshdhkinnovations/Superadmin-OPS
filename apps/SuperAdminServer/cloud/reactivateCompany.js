import { restartCompanyContainer } from '../services/dockerManager.js';
import { registerRoute } from '../services/proxyManager.js';
import { startCompanyFrontend } from '../services/frontendManager.js';
import { companyFrontendPortRangeStart } from '../Utils.js';
import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';

async function nextAvailableFrontendPort() {
  const query = new Parse.Query('Company');
  query.descending('frontendPort');
  const highest = await query.first({ useMasterKey: true });
  return highest && highest.get('frontendPort')
    ? highest.get('frontendPort') + 1
    : companyFrontendPortRangeStart;
}

export default async function reactivateCompany(request) {
  requireSuperAdmin(request);

  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const company = await new Parse.Query('Company').get(id, { useMasterKey: true });
  const before = company.toJSON();

  await restartCompanyContainer(company.get('containerName'));
  await registerRoute({ subdomain: company.get('subdomain'), port: company.get('port') });

  // Older companies (created before per-company frontends existed) won't
  // have a frontendPort yet - assign one now instead of failing.
  let frontendPort = company.get('frontendPort');
  if (!frontendPort) {
    frontendPort = await nextAvailableFrontendPort();
    company.set('frontendPort', frontendPort);
  }
  await startCompanyFrontend({
    slug: company.get('subdomain'),
    backendPort: company.get('port'),
    frontendPort,
  });

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
    message: `Company "${company.get('companyName')}" reactivated - instance restarted.`,
    companyName: company.get('companyName'),
  }).catch(() => {});

  return company.toJSON();
}
