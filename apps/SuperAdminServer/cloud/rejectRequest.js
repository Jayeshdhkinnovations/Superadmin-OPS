import { requireSuperAdmin } from './authGuard.js';
import { writeAuditLog } from './getAuditLogs.js';
import { sendMail } from './mailer.js';
import { approvalRejectedEmail } from './emailTemplates.js';

export default async function rejectRequest(request) {
  requireSuperAdmin(request);

  const { requestId } = request.params;
  if (!requestId) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'requestId is required.');

  const approvalRequest = await new Parse.Query('ApprovalRequest').get(requestId, { useMasterKey: true });
  if (approvalRequest.get('status') !== 'pending') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'This request has already been handled.');
  }

  approvalRequest.set('status', 'rejected');
  approvalRequest.unset('password');
  await approvalRequest.save(null, { useMasterKey: true });

  await writeAuditLog({
    actorEmail: request.user ? request.user.get('email') : 'system',
    action: 'approvalrequest.reject',
    targetId: requestId,
    after: approvalRequest.toJSON(),
  });

  // Best-effort, not awaited - the rejection is already recorded.
  sendMail(
    approvalRequest.get('email'),
    approvalRejectedEmail({
      name: approvalRequest.get('name'),
      companyName: approvalRequest.get('companyName'),
      reason: request.params.reason,
    })
  );

  return { rejected: true };
}
