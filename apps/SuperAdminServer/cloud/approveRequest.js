import { requireSuperAdmin } from './authGuard.js';
import provisionCompany from './provisionCompany.js';
import { writeAuditLog } from './getAuditLogs.js';

export default async function approveRequest(request) {
  requireSuperAdmin(request);

  const { requestId, maxUsers } = request.params;
  if (!requestId || !maxUsers || maxUsers < 1) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'requestId and a positive maxUsers are both required.');
  }

  const approvalRequest = await new Parse.Query('ApprovalRequest').get(requestId, { useMasterKey: true });
  if (approvalRequest.get('status') !== 'pending') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'This request has already been handled.');
  }

  const result = await provisionCompany({
    companyName: approvalRequest.get('companyName'),
    adminName: approvalRequest.get('name'),
    adminEmail: approvalRequest.get('email'),
    adminPassword: approvalRequest.get('password'),
    maxUsers,
    actorEmail: request.user ? request.user.get('email') : 'system',
  });

  approvalRequest.set('status', 'approved');
  approvalRequest.unset('password'); // no longer needed once the real _User exists
  await approvalRequest.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'approvalrequest.approve',
    targetId: requestId,
    after: approvalRequest.toJSON(),
  });

  return result;
}
