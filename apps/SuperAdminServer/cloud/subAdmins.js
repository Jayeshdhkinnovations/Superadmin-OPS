import { requirePrimarySuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';

// Sub-admins get identical console access to the primary admin (see
// authGuard.js's requireSuperAdmin) - this is purely account management, not
// a permissions system. Only the primary admin can create or remove them.

export async function createSubAdmin(request) {
  requirePrimarySuperAdmin(request);
  const { email, password } = request.params;
  if (!email || !password) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'email and password are both required.');
  }
  if (password.length < 8) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Password must be at least 8 characters.');
  }

  const user = new Parse.User();
  user.set('username', email);
  user.set('email', email);
  user.set('password', password);
  user.set('role', 'sub_admin');

  try {
    await user.signUp(null, { useMasterKey: true });
  } catch (err) {
    if (err.code === Parse.Error.USERNAME_TAKEN || err.code === Parse.Error.EMAIL_TAKEN) {
      throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'An account with this email already exists.');
    }
    throw err;
  }

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'subadmin.create',
    targetId: user.id,
    before: null,
    after: { email },
  });

  return { created: true, email };
}

export async function getSubAdmins(request) {
  requirePrimarySuperAdmin(request);
  const query = new Parse.Query(Parse.User);
  query.equalTo('role', 'sub_admin');
  query.descending('createdAt');
  const results = await query.find({ useMasterKey: true });
  return results.map(u => ({
    id: u.id,
    email: u.get('email'),
    createdAt: u.get('createdAt'),
  }));
}

export async function deleteSubAdmin(request) {
  requirePrimarySuperAdmin(request);
  const { id } = request.params;
  if (!id) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required.');

  const query = new Parse.Query(Parse.User);
  query.equalTo('role', 'sub_admin');
  const user = await query.get(id, { useMasterKey: true });
  const email = user.get('email');
  await user.destroy({ useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'subadmin.delete',
    targetId: id,
    before: { email },
    after: null,
  });

  return { deleted: true };
}
