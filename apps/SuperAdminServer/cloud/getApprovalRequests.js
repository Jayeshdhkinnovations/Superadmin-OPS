import { requireSuperAdmin } from './authGuard.js';

export default async function getApprovalRequests(request) {
  requireSuperAdmin(request);

  const { status } = request.params || {};
  const query = new Parse.Query('ApprovalRequest');
  if (status && status !== 'all') query.equalTo('status', status);
  query.descending('createdAt');
  query.limit(200);

  const results = await query.find({ useMasterKey: true });
  // Never send the stored password back to the console, even to a Super
  // Admin - it only needs to exist long enough for approveRequest to use
  // it once, not to be displayed anywhere.
  return {
    requests: results.map((r) => {
      const json = r.toJSON();
      delete json.password;
      return json;
    }),
  };
}
