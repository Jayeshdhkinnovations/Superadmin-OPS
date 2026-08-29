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

    const [userCount, documentsSigned, templates, credits] = await Promise.all([
      // Not _User: sending someone a document to sign creates a _User
      // record for them even though they never get dashboard access - that
      // inflated every company's count with signer-only accounts that were
      // never really "using a seat". contracts_Users is the real membership
      // table (same rule loginUser.js and googleLoginLookup.js already use
      // to decide who actually belongs to a company).
      names.has('contracts_Users') ? db.collection('contracts_Users').countDocuments({}) : 0,
      names.has('contracts_Document')
        ? db.collection('contracts_Document').countDocuments({ IsCompleted: true })
        : 0,
      names.has('contracts_Template') ? db.collection('contracts_Template').countDocuments({}) : 0,
      // partners_TenantCredits.usedStorage is the same running total OpenSign
      // itself increments on every upload (Utils.js saveFileUsage) and shows
      // the admin on their own dashboard - db.stats().dataSize was used here
      // before, but that's MongoDB's own metadata/document footprint, not
      // the uploaded files (stored outside Mongo), so it never matched what
      // the company actually saw as "storage used".
      names.has('partners_TenantCredits')
        ? db.collection('partners_TenantCredits').find({}).toArray()
        : [],
    ]);

    const storageBytes = (credits || []).reduce((sum, c) => sum + (c.usedStorage || 0), 0);

    return {
      userCount,
      documentsSigned,
      templates,
      storageBytes,
    };
  } catch (err) {
    console.log(`getCompanyLiveStats: skipped ${databaseName}: ${err.message}`);
    return zero;
  } finally {
    await client.close().catch(() => {});
  }
}
