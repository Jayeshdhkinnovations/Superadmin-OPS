import { requireSuperAdmin } from './authGuard.js';

export default async function getPlatformStats(request) {
  requireSuperAdmin(request);

  const allQuery = new Parse.Query('Company');
  const companies = await allQuery.find({ useMasterKey: true });

  const activeCompanies = companies.filter((c) => c.get('status') === 'active').length;
  const suspendedCompanies = companies.filter((c) => c.get('status') === 'suspended').length;
  const totalUsers = companies.reduce((sum, c) => sum + (c.get('currentUserCount') || 0), 0);

  const recentQuery = new Parse.Query('Company');
  recentQuery.descending('createdAt');
  recentQuery.limit(10);
  const recent = await recentQuery.find({ useMasterKey: true });

  const errorQuery = new Parse.Query('SystemLog');
  errorQuery.equalTo('level', 'error');
  errorQuery.greaterThanOrEqualTo('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000));
  const errorCountLast24h = await errorQuery.count({ useMasterKey: true });

  return {
    totalCompanies: companies.length,
    activeCompanies,
    suspendedCompanies,
    totalUsers,
    // Document/storage totals would need querying each company's own
    // database live - left as 0 in testing mode, a fuller implementation
    // would loop over active companies and aggregate from each one.
    totalDocuments: 0,
    totalStorageBytes: 0,
    recentSignups: recent.map((c) => ({
      objectId: c.id,
      companyName: c.get('companyName'),
      adminEmail: c.get('adminEmail'),
      maxUsers: c.get('maxUsers'),
      createdAt: c.get('createdAt'),
    })),
    errorCountLast24h,
  };
}
