import { requireSuperAdmin } from './authGuard.js';
import { getCompanyLiveStats } from './companyStats.js';

export default async function getCompanyById(request) {
  requireSuperAdmin(request);

  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const query = new Parse.Query('Company');
  const company = await query.get(id, { useMasterKey: true });
  const stats = await getCompanyLiveStats(company.get('databaseName'));

  return {
    ...company.toJSON(),
    currentUserCount: stats.userCount,
    storageBytes: stats.storageBytes,
    documentCount: stats.documentsSigned,
    templates: stats.templates,
  };
}
