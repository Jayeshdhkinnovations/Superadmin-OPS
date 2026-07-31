import { MongoClient } from 'mongodb';
import { removeCompanyContainer } from '../services/dockerManager.js';
import { removeRoute } from '../services/proxyManager.js';
import { stopCompanyFrontend } from '../services/frontendManager.js';
import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';

export default async function deleteCompany(request) {
  requireSuperAdmin(request);

  const { id, confirm } = request.params;
  if (!id || !confirm) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id and confirm are both required.');
  }

  const company = await new Parse.Query('Company').get(id, { useMasterKey: true });
  const before = company.toJSON();

  // Exact, case-sensitive match required - this is the safety net even if
  // the frontend's own confirmation dialog already checked this.
  if (confirm !== company.get('companyName')) {
    throw new Parse.Error(422, 'Company name confirmation did not match. Nothing was deleted.');
  }

  // 1. Stop and remove their running instance (backend container + frontend).
  await removeCompanyContainer(company.get('containerName'));
  stopCompanyFrontend(company.get('subdomain'));

  // 2. Permanently drop their entire database.
  const mongoUri = process.env.MONGODB_URI.replace(/\/[^/]+$/, `/${company.get('databaseName')}`);
  const client = new MongoClient(mongoUri);
  await client.connect();
  await client.db().dropDatabase();
  await client.close();

  // 3. Remove their subdomain route.
  await removeRoute({ subdomain: company.get('subdomain') });

  // 4. Remove their entry from the control plane.
  await company.destroy({ useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'company.delete',
    targetId: id,
    before,
    after: null,
  });

  await writeSystemLog({
    level: 'info',
    route: 'functions/deletecompany',
    message: `Company "${before.companyName}" deleted - container, frontend, and database removed.`,
    companyName: before.companyName,
  }).catch(() => {});

  return { deleted: true, companyName: before.companyName };
}
