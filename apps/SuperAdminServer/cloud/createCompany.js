import {
  slugifyCompanyName,
  companyMasterKey,
  companyAppId,
  openSignInternalUrl,
  openSignPublicOrigin,
  openSignInternalAdminSecret,
  generateSecureTempPassword,
} from '../Utils.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';
import { requireSuperAdmin } from './authGuard.js';

export default async function createCompany(request) {
  requireSuperAdmin(request);

  const { companyName, adminName, adminEmail, maxUsers } = request.params;
  if (!companyName || !adminName || !adminEmail || !maxUsers || maxUsers < 1) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'companyName, adminName, adminEmail and a positive maxUsers are all required.');
  }

  const slug = slugifyCompanyName(companyName);
  if (!slug) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'companyName must contain at least one letter or number.');
  }

  const existing = await new Parse.Query('Company').equalTo('subdomain', slug).first({ useMasterKey: true });
  if (existing) {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, `A company already exists with a matching name (subdomain "${slug}" is taken).`);
  }

  const databaseName = `${slug}_DB`;
  const adminTempPassword = generateSecureTempPassword();

  // Reserve the company record immediately, in "provisioning" state - this
  // is what lets a failure below be cleanly detected and rolled back instead
  // of leaving an orphaned, half-created company (see Property 2 in
  // requirements.md - provisioning must be all-or-nothing).
  //
  // Note: unlike the old per-company-container design, there's no
  // "container" or dedicated port to record anymore - every company shares
  // the one running OpenSign container, distinguished only by subdomain.
  const Company = Parse.Object.extend('Company');
  const company = new Company();
  company.set('companyName', companyName);
  company.set('adminEmail', adminEmail);
  company.set('subdomain', slug);
  company.set('databaseName', databaseName);
  company.set('maxUsers', maxUsers);
  company.set('currentUserCount', 1);
  company.set('status', 'provisioning');
  await company.save(null, { useMasterKey: true });

  // All requests to this company go to the shared OpenSign container, at
  // its own path - the mount handles routing to the right database.
  const companyServerUrl = `${openSignInternalUrl}/app/${slug}`;

  // Tracked so the catch block below can actually delete whatever got
  // created before the failure, instead of just abandoning it - a failed
  // attempt that left a real _User behind would otherwise permanently
  // block any retry with that same email ("Account already exists"),
  // even though the company itself was never really created.
  let userId, tenantId, profileId, orgId, teamId;
  const headers = {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': companyAppId,
    'X-Parse-Master-Key': companyMasterKey,
  };

  try {
    // 1. Tell the already-running OpenSign container to mount this
    // company's database live - no restart, no new container, and every
    // other company's active session is completely unaffected.
    if (!openSignInternalAdminSecret) {
      throw new Error('OPENSIGN_INTERNAL_ADMIN_SECRET is not configured on SuperAdminServer.');
    }
    const mountRes = await fetch(`${openSignInternalUrl}/admin/mount-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': openSignInternalAdminSecret,
      },
      body: JSON.stringify({ slug, databaseName }),
    }).then((r) => r.json());
    if (mountRes.error) throw new Error(`Failed mounting company on OpenSign: ${mountRes.error}`);

    // 2. Create the admin login + Tenant/Organization/Team/profile chain
    // inside their new mount, via ITS OWN API with master key access - the
    // exact same chain that already happens automatically during normal
    // OpenSign sign-up, just triggered here instead of self-service.
    const userRes = await fetch(`${companyServerUrl}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: adminEmail, password: adminTempPassword, email: adminEmail, name: adminName }),
    }).then((r) => r.json());
    if (!userRes.objectId) throw new Error(`Failed creating admin login: ${JSON.stringify(userRes)}`);
    userId = userRes.objectId;

    const tenantRes = await fetch(`${companyServerUrl}/classes/partners_Tenant`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        TenantName: companyName,
        EmailAddress: adminEmail,
        IsActive: true,
        Domain: `${slug}.yourbrand.com`,
        MaxUsers: maxUsers,
        UserId: { __type: 'Pointer', className: '_User', objectId: userId },
        CreatedBy: { __type: 'Pointer', className: '_User', objectId: userId },
      }),
    }).then((r) => r.json());
    if (!tenantRes.objectId) throw new Error(`Failed creating tenant: ${JSON.stringify(tenantRes)}`);
    tenantId = tenantRes.objectId;

    // Order matches OpenSign's real /addadmin signup flow exactly
    // (AddAdmin.js): profile first (without org/team yet), then the
    // organization (which points back at this profile via ExtUserId, the
    // same as real signup does), then the team, then the profile gets
    // updated with the org/team it was missing at creation time.
    const profileRes = await fetch(`${companyServerUrl}/classes/contracts_Users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        UserId: { __type: 'Pointer', className: '_User', objectId: userId },
        TenantId: { __type: 'Pointer', className: 'partners_Tenant', objectId: tenantId },
        UserRole: 'contracts_Admin',
        Email: adminEmail,
        Name: adminName,
        Company: companyName,
      }),
    }).then((r) => r.json());
    if (!profileRes.objectId) throw new Error(`Failed creating admin profile: ${JSON.stringify(profileRes)}`);
    profileId = profileRes.objectId;

    const orgRes = await fetch(`${companyServerUrl}/classes/contracts_Organizations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Name: companyName,
        IsActive: true,
        TenantId: { __type: 'Pointer', className: 'partners_Tenant', objectId: tenantId },
        CreatedBy: { __type: 'Pointer', className: '_User', objectId: userId },
        ExtUserId: { __type: 'Pointer', className: 'contracts_Users', objectId: profileId },
      }),
    }).then((r) => r.json());
    if (!orgRes.objectId) throw new Error(`Failed creating organization: ${JSON.stringify(orgRes)}`);
    orgId = orgRes.objectId;

    const teamRes = await fetch(`${companyServerUrl}/classes/contracts_Teams`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Name: 'All Users',
        IsActive: true,
        OrganizationId: { __type: 'Pointer', className: 'contracts_Organizations', objectId: orgId },
      }),
    }).then((r) => r.json());
    if (!teamRes.objectId) throw new Error(`Failed creating team: ${JSON.stringify(teamRes)}`);
    teamId = teamRes.objectId;

    const updateProfileRes = await fetch(`${companyServerUrl}/classes/contracts_Users/${profileId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        OrganizationId: { __type: 'Pointer', className: 'contracts_Organizations', objectId: orgId },
        TeamIds: [{ __type: 'Pointer', className: 'contracts_Teams', objectId: teamId }],
      }),
    }).then((r) => r.json());
    if (!updateProfileRes.updatedAt) throw new Error(`Failed updating admin profile with org/team: ${JSON.stringify(updateProfileRes)}`);

    // Bootstrap core classes (contracts_Document, contracts_Contactbook,
    // contracts_Template) that only get created on first real use. Without
    // this, a brand-new company's admin hits "Permission denied" the very
    // first time they create a folder/document/contact/template - Parse
    // Server refuses non-master-key writes to a class that doesn't exist
    // yet (allowClientClassCreation is off). Declared through the Schema
    // API (not a throwaway object) so it never fires any beforeSave/
    // afterSave trigger on a placeholder that would crash on delete.
    for (const className of ['contracts_Document', 'contracts_Contactbook', 'contracts_Template']) {
      await fetch(`${companyServerUrl}/schemas/${className}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ className, fields: { Name: { type: 'String' } } }),
      }).then((r) => r.json());
    }

    // 3. Mark the company active now that every step succeeded.
    company.set('status', 'active');
    await company.save(null, { useMasterKey: true });

    await writeAuditLog({
      actorEmail: request.user ? request.user.get('email') : 'system',
      action: 'company.create',
      targetId: company.id,
      after: company.toJSON(),
    });

    await writeSystemLog({
      level: 'info',
      route: 'functions/createcompany',
      message: `Company "${companyName}" provisioned successfully.`,
      companyName,
      meta: { subdomain: slug },
    }).catch(() => {});

    return {
      companyId: company.id,
      companyName,
      subdomain: slug,
      adminEmail,
      adminTempPassword,
      // NOTE: the shared frontend doesn't yet know how to target a
      // specific company's mount on its own (that needs the "email-first
      // lookup" routing discussed separately, not built yet) - this is
      // the one shared frontend URL, not a company-specific deep link.
      loginUrl: openSignPublicOrigin,
      backendUrl: companyServerUrl,
    };
  } catch (err) {
    // Actually delete whatever got created before the failure - not just
    // the control-plane record. Without this, a failed attempt leaves a
    // real _User (and possibly tenant/profile/org/team) behind, which
    // permanently blocks any retry with the same email ("Account already
    // exists") even though the company itself was never really created.
    // Deleted in reverse dependency order; each is independently guarded
    // so one missing/already-gone record doesn't stop the rest from
    // being cleaned up.
    const cleanupSteps = [
      teamId && { url: `${companyServerUrl}/classes/contracts_Teams/${teamId}` },
      orgId && { url: `${companyServerUrl}/classes/contracts_Organizations/${orgId}` },
      profileId && { url: `${companyServerUrl}/classes/contracts_Users/${profileId}` },
      tenantId && { url: `${companyServerUrl}/classes/partners_Tenant/${tenantId}` },
      userId && { url: `${companyServerUrl}/users/${userId}` },
    ].filter(Boolean);
    for (const step of cleanupSteps) {
      await fetch(step.url, { method: 'DELETE', headers }).catch(() => {});
    }

    // The live mount itself is left in place (no "unmount" capability),
    // but that's harmless now that its data has been cleaned up - it's
    // just an empty, unreachable database with no matching Company record.
    await company.destroy({ useMasterKey: true });

    await writeSystemLog({
      level: 'error',
      route: 'functions/createcompany',
      message: `Company "${companyName}" provisioning failed and was rolled back: ${err.message}`,
      companyName,
      meta: { subdomain: slug, cleanedUp: cleanupSteps.map((s) => s.url) },
    }).catch(() => {});

    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, `Company provisioning failed and was rolled back: ${err.message}`);
  }
}
