import { MongoClient } from 'mongodb';

// Live per-company usage, computed by connecting directly to that company's
// isolated database - there's no shared collection to read this from, and
// stored counters (currentUserCount etc.) go stale the moment a user is
// added straight through OpenSign instead of through the Super Admin flow.
// A single unreachable/empty company database must never break the caller's
// whole page, so failures here resolve to zeroed-out stats instead of throwing.
export async function getCompanyLiveStats(databaseName) {
  const zero = { userCount: 0, documentsSigned: 0, templates: 0, storageBytes: 0 };
  if (!databaseName || !process.env.MONGODB_URI) return zero;

  const mongoUri = process.env.MONGODB_URI.replace(/\/[^/]+$/, `/${databaseName}`);
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const names = new Set(collections.map((c) => c.name));

    const [userCount, documentsSigned, templates, dbStats] = await Promise.all([
      names.has('_User') ? db.collection('_User').countDocuments({}) : 0,
      names.has('contracts_Document')
        ? db.collection('contracts_Document').countDocuments({ IsCompleted: true })
        : 0,
      names.has('contracts_Template') ? db.collection('contracts_Template').countDocuments({}) : 0,
      db.stats(),
    ]);

    return {
      userCount,
      documentsSigned,
      templates,
      // dataSize is the real, live footprint of everything stored in this
      // company's database - a true proxy for "storage used" without
      // needing OpenSign to track file sizes anywhere itself.
      storageBytes: dbStats?.dataSize || 0,
    };
  } catch (err) {
    console.log(`getCompanyLiveStats: skipped ${databaseName}: ${err.message}`);
    return zero;
  } finally {
    await client.close().catch(() => {});
  }
}
