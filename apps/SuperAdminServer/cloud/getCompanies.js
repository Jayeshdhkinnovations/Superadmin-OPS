import { requireSuperAdmin } from './authGuard.js';
import { getCompanyLiveStats } from './companyStats.js';

export default async function getCompanies(request) {
  requireSuperAdmin(request);

  const { search, status, page = 0, limit = 50 } = request.params || {};

  const query = new Parse.Query('Company');
  if (status && status !== 'all') {
    query.equalTo('status', status);
  }
  if (search) {
    const nameQuery = new Parse.Query('Company');
    nameQuery.matches('companyName', search, 'i');
    const emailQuery = new Parse.Query('Company');
    emailQuery.matches('adminEmail', search, 'i');
    query._orQuery([nameQuery, emailQuery]);
  }
  query.descending('createdAt');
  query.skip(page * limit);
  query.limit(limit);

  const [companies, total] = await Promise.all([
    query.find({ useMasterKey: true }),
    query.count({ useMasterKey: true }),
  ]);

  // currentUserCount/storageBytes on the Company record itself would go
  // stale the moment a user is added straight through OpenSign - pull the
  // real, live numbers from each company's own database instead.
  const withLiveStats = await Promise.all(
    companies.map(async (c) => {
      const stats = await getCompanyLiveStats(c.get('databaseName'));
      return {
        ...c.toJSON(),
        currentUserCount: stats.userCount,
        storageBytes: stats.storageBytes,
        documentCount: stats.documentsSigned,
      };
    })
  );

  return {
    companies: withLiveStats,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
