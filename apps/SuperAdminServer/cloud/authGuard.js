// Guard used at the top of every Super Admin cloud function. Master-key
// calls (our own testing, or trusted internal jobs) are always allowed;
// a real logged-in user must have the super_admin role on their _User record.
export function requireSuperAdmin(request) {
  if (request.master) return;
  if (request.user && request.user.get('role') === 'super_admin') return;
  throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'FORBIDDEN_SUPER_ADMIN_REQUIRED');
}
