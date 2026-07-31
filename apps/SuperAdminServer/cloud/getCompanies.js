import { requireSuperAdmin } from './authGuard.js';

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

  return {
    companies: companies.map((c) => c.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
