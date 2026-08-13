import { MongoClient } from 'mongodb';
import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';

export async function getCompanyNameChangeRequests(request) {
  requireSuperAdmin(request);
  const { status } = request.params || {};
  const query = new Parse.Query('CompanyNameChangeRequest');
  if (status && status !== 'all') query.equalTo('status', status);
  query.descending('createdAt');
  query.limit(200);
  const results = await query.find({ useMasterKey: true });
  return { requests: results.map(r => r.toJSON()) };
}

export async function approveCompanyNameChange(request) {
  requireSuperAdmin(request);
  const { requestId } = request.params;
  if (!requestId) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'requestId is required.');

  const changeRequest = await new Parse.Query('CompanyNameChangeRequest').get(requestId, {
    useMasterKey: true,
  });
  if (changeRequest.get('status') !== 'pending') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'This request has already been handled.');
  }

  const subdomain = changeRequest.get('subdomain');
  const newName = changeRequest.get('newName');

  const company = await new Parse.Query('Company').equalTo('subdomain', subdomain).first({
    useMasterKey: true,
  });
  if (!company) throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Company not found.');
  const databaseName = company.get('databaseName');

  // The name lives in two places: the control plane's own Company record
  // (what this console lists), and every member's contracts_Users.Company
  // field inside the company's own database (what the dashboard shows
  // them). Both need to agree once approved.
  company.set('companyName', newName);
  await company.save(null, { useMasterKey: true });

  if (databaseName) {
    const baseMongoUri = (process.env.MONGODB_URI || 'mongodb://localhost:27030/SuperAdminDB').replace(
      /\/[^/]+$/,
      ''
    );
    const client = new MongoClient(`${baseMongoUri}/${databaseName}`);
    try {
      await client.connect();
      await client.db().collection('contracts_Users').updateMany({}, { $set: { Company: newName } });
    } finally {
      await client.close();
    }
  }

  changeRequest.set('status', 'approved');
  await changeRequest.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'companynamechange.approve',
    targetId: requestId,
    before: { companyName: changeRequest.get('oldName') },
    after: { companyName: newName },
  });

  return { approved: true, companyName: newName };
}

export async function rejectCompanyNameChange(request) {
  requireSuperAdmin(request);
  const { requestId } = request.params;
  if (!requestId) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'requestId is required.');

  const changeRequest = await new Parse.Query('CompanyNameChangeRequest').get(requestId, {
    useMasterKey: true,
  });
  if (changeRequest.get('status') !== 'pending') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'This request has already been handled.');
  }
  changeRequest.set('status', 'rejected');
  await changeRequest.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'companynamechange.reject',
    targetId: requestId,
  });

  return { rejected: true };
}
