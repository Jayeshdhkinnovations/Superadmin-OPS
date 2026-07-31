import { requireSuperAdmin } from './authGuard.js';

export default async function getCompanyById(request) {
  requireSuperAdmin(request);

  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const query = new Parse.Query('Company');
  const company = await query.get(id, { useMasterKey: true });
  return company.toJSON();
}
