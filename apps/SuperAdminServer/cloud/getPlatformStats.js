import { requireSuperAdmin } from './authGuard.js';
import { getCompanyLiveStats } from './companyStats.js';

export default async function getPlatformStats(request) {
  requireSuperAdmin(request);

  const allQuery = new Parse.Query('Company');
  const companies = await allQuery.find({ useMasterKey: true });

  const activeCompanies = companies.filter((c) => c.get('status') === 'active').length;
  const suspendedCompanies = companies.filter((c) => c.get('status') === 'suspended').length;

  const recentQuery = new Parse.Query('Company');
  recentQuery.descending('createdAt');
  recentQuery.limit(10);
  const recent = await recentQuery.find({ useMasterKey: true });

  const errorQuery = new Parse.Query('SystemLog');
  errorQuery.equalTo('level', 'error');
  errorQuery.greaterThanOrEqualTo('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000));
  const errorCountLast24h = await errorQuery.count({ useMasterKey: true });

  // Users, documents, templates, and storage all live inside each company's
  // own isolated database - connect to each one directly and add it up,
  // rather than trusting a stored counter that can only go stale (e.g. a
  // user added straight through OpenSign never touches the Company record).
  let totalUsers = 0;
  let totalDocumentsSigned = 0;
  let totalTemplates = 0;
  let totalStorageBytes = 0;

  for (const company of companies) {
    const stats = await getCompanyLiveStats(company.get('databaseName'));
    totalUsers += stats.userCount;
    totalDocumentsSigned += stats.documentsSigned;
    totalTemplates += stats.templates;
    totalStorageBytes += stats.storageBytes;
  }

  return {
    totalCompanies: companies.length,
    activeCompanies,
    suspendedCompanies,
    totalUsers,
    totalDocumentsSigned,
    totalTemplates,
    totalStorageBytes,
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
