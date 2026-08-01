import { MongoClient } from 'mongodb';
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

  // Signed documents, templates, and storage all live inside each
  // company's own isolated database - there's no shared collection to
  // aggregate from, so connect to each one directly and add it up.
  // A single unreachable/empty company database shouldn't break the whole
  // dashboard, so failures here are skipped rather than thrown.
  let totalDocumentsSigned = 0;
  let totalTemplates = 0;
  let totalStorageBytes = 0;

  for (const company of companies) {
    const databaseName = company.get('databaseName');
    if (!databaseName) continue;

    const mongoUri = process.env.MONGODB_URI.replace(/\/[^/]+$/, `/${databaseName}`);
    const client = new MongoClient(mongoUri);
    try {
      await client.connect();
      const db = client.db();
      const collections = await db.listCollections({}, { nameOnly: true }).toArray();
      const names = new Set(collections.map((c) => c.name));

      if (names.has('contracts_Document')) {
        totalDocumentsSigned += await db
          .collection('contracts_Document')
          .countDocuments({ IsCompleted: true });
      }

      if (names.has('contracts_Template')) {
        totalTemplates += await db.collection('contracts_Template').countDocuments({});
      }

      if (names.has('partners_TenantCredits')) {
        const credits = await db.collection('partners_TenantCredits').find({}).toArray();
        totalStorageBytes += credits.reduce((sum, c) => sum + (c.usedStorage || 0), 0);
      }
    } catch (err) {
      console.log(`getPlatformStats: skipped ${databaseName}: ${err.message}`);
    } finally {
      await client.close();
    }
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
