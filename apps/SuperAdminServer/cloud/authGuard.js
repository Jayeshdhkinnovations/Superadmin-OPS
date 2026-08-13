// Guard used at the top of every Super Admin cloud function. Master-key
// calls (our own testing, or trusted internal jobs) are always allowed; a
// real logged-in user must be super_admin or sub_admin - sub-admins get the
// same console access as the primary admin, just a separate account, so
// every existing call site keeps working unchanged for both roles.
export function requireSuperAdmin(request) {
  if (request.master) return;
  const role = request.user && request.user.get('role');
  if (role === 'super_admin' || role === 'sub_admin') return;
  throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'FORBIDDEN_SUPER_ADMIN_REQUIRED');
}

// Only the primary super_admin may manage other admins - a sub-admin
// creating more sub-admins (or resetting the primary's password) is out of
// scope for what "give them console access" was asking for.
export function requirePrimarySuperAdmin(request) {
  if (request.master) return;
  if (request.user && request.user.get('role') === 'super_admin') return;
  throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'FORBIDDEN_SUPER_ADMIN_REQUIRED');
}
