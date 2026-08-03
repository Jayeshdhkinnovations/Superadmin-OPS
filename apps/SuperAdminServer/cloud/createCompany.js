import { generateSecureTempPassword } from '../Utils.js';
import { requireSuperAdmin } from './authGuard.js';
import provisionCompany from './provisionCompany.js';

// Direct path: Super Admin fills the form themselves, a password is
// generated for them to hand to the new admin. See approveRequest.js for
// the other path - an end user registers themselves, picks their own
// password, and a company only actually gets created once approved.
export default async function createCompany(request) {
  requireSuperAdmin(request);

  const { companyName, adminName, adminEmail, maxUsers } = request.params;
  const adminTempPassword = generateSecureTempPassword();

  const result = await provisionCompany({
    companyName,
    adminName,
    adminEmail,
    adminPassword: adminTempPassword,
    maxUsers,
    actorEmail: request.user ? request.user.get('email') : 'system',
  });

  return { ...result, adminTempPassword };
}
