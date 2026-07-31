import { startCompanyContainer, removeCompanyContainer } from '../services/dockerManager.js';
import { registerRoute } from '../services/proxyManager.js';
import { startCompanyFrontend, stopCompanyFrontend } from '../services/frontendManager.js';
import {
  slugifyCompanyName,
  companyMasterKey,
  companyAppId,
  companyPortRangeStart,
  companyFrontendPortRangeStart,
  generateSecureTempPassword,
} from '../Utils.js';
import { writeAuditLog } from './getAuditLogs.js';
import { writeSystemLog } from './getSystemLogs.js';
import { requireSuperAdmin } from './authGuard.js';

// Waits for a freshly-started container's Parse Server to actually answer,
// since it takes a few seconds to boot - same "poll until healthy" pattern
// used throughout today's manual testing.
async function waitUntilHealthy(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not up yet, keep waiting
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Company instance at ${url} did not become healthy in time`);
}

async function nextAvailablePort() {
  const query = new Parse.Query('Company');
  query.descending('port');
  const highest = await query.first({ useMasterKey: true });
  return highest ? highest.get('port') + 1 : companyPortRangeStart;
}

async function nextAvailableFrontendPort() {
  const query = new Parse.Query('Company');
  query.descending('frontendPort');
  const highest = await query.first({ useMasterKey: true });
  return highest && highest.get('frontendPort')
    ? highest.get('frontendPort') + 1
    : companyFrontendPortRangeStart;
}

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
  const containerName = `opensign-company-${slug}`;
  const port = await nextAvailablePort();
  const frontendPort = await nextAvailableFrontendPort();
  const adminTempPassword = generateSecureTempPassword();

  // Reserve the company record immediately, in "provisioning" state - this
  // is what lets a failure below be cleanly detected and rolled back instead
  // of leaving an orphaned, half-created company (see Property 2 in
  // requirements.md - provisioning must be all-or-nothing).
  const Company = Parse.Object.extend('Company');
  const company = new Company();
  company.set('companyName', companyName);
  company.set('adminEmail', adminEmail);
  company.set('subdomain', slug);
  company.set('databaseName', databaseName);
  company.set('containerName', containerName);
  company.set('port', port);
  company.set('frontendPort', frontendPort);
  company.set('maxUsers', maxUsers);
  company.set('currentUserCount', 1);
  company.set('status', 'provisioning');
  await company.save(null, { useMasterKey: true });

  try {
    // 1. Start their dedicated OpenSignServer container, pointed at a brand
    // new database (MongoDB creates it automatically on first write).
    await startCompanyContainer({ containerName, hostPort: port, databaseName });

    const companyServerUrl = `http://localhost:${port}`;
    await waitUntilHealthy(companyServerUrl);

    // 2. Create the admin login + Tenant/Organization/Team/profile chain
    // inside their new instance, via ITS OWN API with master key access -
    // the exact same chain that already happens automatically during
    // normal OpenSign sign-up, just triggered here instead of self-service.
    const headers = {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': companyAppId,
      'X-Parse-Master-Key': companyMasterKey,
    };

    const userRes = await fetch(`${companyServerUrl}/app/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: adminEmail, password: adminTempPassword, email: adminEmail, name: adminName }),
    }).then((r) => r.json());
    if (!userRes.objectId) throw new Error(`Failed creating admin login: ${JSON.stringify(userRes)}`);
    const userId = userRes.objectId;

    const tenantRes = await fetch(`${companyServerUrl}/app/classes/partners_Tenant`, {
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
    const tenantId = tenantRes.objectId;

    const orgRes = await fetch(`${companyServerUrl}/app/classes/contracts_Organizations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Name: companyName,
        IsActive: true,
        TenantId: { __type: 'Pointer', className: 'partners_Tenant', objectId: tenantId },
        CreatedBy: { __type: 'Pointer', className: '_User', objectId: userId },
      }),
    }).then((r) => r.json());
    if (!orgRes.objectId) throw new Error(`Failed creating organization: ${JSON.stringify(orgRes)}`);
    const orgId = orgRes.objectId;

    const teamRes = await fetch(`${companyServerUrl}/app/classes/contracts_Teams`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Name: 'All Users',
        IsActive: true,
        OrganizationId: { __type: 'Pointer', className: 'contracts_Organizations', objectId: orgId },
      }),
    }).then((r) => r.json());
    if (!teamRes.objectId) throw new Error(`Failed creating team: ${JSON.stringify(teamRes)}`);
    const teamId = teamRes.objectId;

    const profileRes = await fetch(`${companyServerUrl}/app/classes/contracts_Users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        UserId: { __type: 'Pointer', className: '_User', objectId: userId },
        TenantId: { __type: 'Pointer', className: 'partners_Tenant', objectId: tenantId },
        OrganizationId: { __type: 'Pointer', className: 'contracts_Organizations', objectId: orgId },
        TeamIds: [{ __type: 'Pointer', className: 'contracts_Teams', objectId: teamId }],
        UserRole: 'contracts_Admin',
        Email: adminEmail,
        Name: adminName,
        Company: companyName,
      }),
    }).then((r) => r.json());
    if (!profileRes.objectId) throw new Error(`Failed creating admin profile: ${JSON.stringify(profileRes)}`);

    // Bootstrap core classes (contracts_Document, contracts_Contactbook,
    // contracts_Template) that only get created on first real use. Without
    // this, a brand-new company's admin hits "Permission denied" the very
    // first time they create a folder/document/contact/template - Parse
    // Server refuses non-master-key writes to a class that doesn't exist
    // yet (allowClientClassCreation is off).
    //
    // This used to create one throwaway object per class and immediately
    // delete it, but contracts_Document has a real afterSave trigger
    // (DocumentAftersave, in OpenSignServer) that does async PDF work off
    // a placeholder object with none of the fields it expects - by the time
    // it runs, the delete above had already removed the object, so it threw
    // an uncaught "Object not found" that crashed the whole container
    // (confirmed via `docker logs`, exit code 7). Declaring the class
    // directly through the Schema API instead never creates an object, so
    // it never fires any beforeSave/afterSave trigger, and still leaves the
    // class registered with the same open default CLP every other
    // master-key-created class gets.
    for (const className of ['contracts_Document', 'contracts_Contactbook', 'contracts_Template']) {
      await fetch(`${companyServerUrl}/app/schemas/${className}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ className, fields: { Name: { type: 'String' } } }),
      }).then((r) => r.json());
    }

    // 3. Register their subdomain route (no-op stub in testing mode).
    await registerRoute({ subdomain: slug, port });

    // 3b. Start their own dedicated frontend, pointed at this backend, so
    // there's a real login page to click into - not just the raw API.
    const frontendUrl = await startCompanyFrontend({ slug, backendPort: port, frontendPort });

    // 4. Mark the company active now that every step succeeded.
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
      meta: { subdomain: slug, port, frontendPort },
    }).catch(() => {});

    return {
      companyId: company.id,
      companyName,
      subdomain: slug,
      port,
      adminEmail,
      adminTempPassword,
      loginUrl: frontendUrl,
      backendUrl: companyServerUrl,
    };
  } catch (err) {
    // Roll back everything already done, so no orphaned half-created
    // company is left behind (Property 2 - provisioning is all-or-nothing).
    stopCompanyFrontend(slug);
    await removeCompanyContainer(containerName);
    await company.destroy({ useMasterKey: true });
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, `Company provisioning failed and was rolled back: ${err.message}`);
  }
}
