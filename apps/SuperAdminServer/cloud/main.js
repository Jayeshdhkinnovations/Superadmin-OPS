import createCompany from './createCompany.js';
import getCompanies from './getCompanies.js';
import getCompanyById from './getCompanyById.js';
import updateCompanyLimit from './updateCompanyLimit.js';
import suspendCompany from './suspendCompany.js';
import reactivateCompany from './reactivateCompany.js';
import deleteCompany from './deleteCompany.js';
import getPlatformStats from './getPlatformStats.js';
import getSystemLogs, { writeSystemLog } from './getSystemLogs.js';
import { getAuditLogs } from './getAuditLogs.js';
import getApprovalRequests from './getApprovalRequests.js';
import approveRequest from './approveRequest.js';
import rejectRequest from './rejectRequest.js';
import { createSubAdmin, getSubAdmins, deleteSubAdmin } from './subAdmins.js';
import {
  getCompanyNameChangeRequests,
  approveCompanyNameChange,
  rejectCompanyNameChange,
} from './companyNameChange.js';
import { requireSuperAdmin } from './authGuard.js';

export default async function getme(request) {
  requireSuperAdmin(request);
  return {
    email: request.user ? request.user.get('email') : null,
    role: request.user ? request.user.get('role') : 'super_admin',
  };
}

// Wraps every cloud function so any error it throws - validation, a Docker
// failure, an unexpected crash, anything - is captured in SystemLog before
// being re-thrown to the caller as normal. This is what makes the Logs page
// show real errors going forward without every function needing its own
// try/catch: one place, guaranteed coverage for every function defined below
// (and any added later, as long as it goes through this wrapper).
function withErrorLogging(name, fn) {
  return async (request) => {
    try {
      return await fn(request);
    } catch (err) {
      await writeSystemLog({
        level: 'error',
        route: `functions/${name}`,
        message: err.message || 'Unknown error',
        companyName: request.params?.companyName,
        errorCode: err.code,
        stack: err.stack,
      }).catch(() => {});
      throw err;
    }
  };
}

Parse.Cloud.define('getme', withErrorLogging('getme', getme));
Parse.Cloud.define('createcompany', withErrorLogging('createcompany', createCompany));
Parse.Cloud.define('getcompanies', withErrorLogging('getcompanies', getCompanies));
Parse.Cloud.define('getcompanybyid', withErrorLogging('getcompanybyid', getCompanyById));
Parse.Cloud.define('updatecompanylimit', withErrorLogging('updatecompanylimit', updateCompanyLimit));
Parse.Cloud.define('suspendcompany', withErrorLogging('suspendcompany', suspendCompany));
Parse.Cloud.define('reactivatecompany', withErrorLogging('reactivatecompany', reactivateCompany));
Parse.Cloud.define('deletecompany', withErrorLogging('deletecompany', deleteCompany));
Parse.Cloud.define('getplatformstats', withErrorLogging('getplatformstats', getPlatformStats));
Parse.Cloud.define('getsystemlogs', withErrorLogging('getsystemlogs', getSystemLogs));
Parse.Cloud.define('getauditlogs', withErrorLogging('getauditlogs', getAuditLogs));
Parse.Cloud.define('getapprovalrequests', withErrorLogging('getapprovalrequests', getApprovalRequests));
Parse.Cloud.define('approverequest', withErrorLogging('approverequest', approveRequest));
Parse.Cloud.define('rejectrequest', withErrorLogging('rejectrequest', rejectRequest));
Parse.Cloud.define('createsubadmin', withErrorLogging('createsubadmin', createSubAdmin));
Parse.Cloud.define('getsubadmins', withErrorLogging('getsubadmins', getSubAdmins));
Parse.Cloud.define('deletesubadmin', withErrorLogging('deletesubadmin', deleteSubAdmin));
Parse.Cloud.define(
  'getcompanynamechangerequests',
  withErrorLogging('getcompanynamechangerequests', getCompanyNameChangeRequests)
);
Parse.Cloud.define(
  'approvecompanynamechange',
  withErrorLogging('approvecompanynamechange', approveCompanyNameChange)
);
Parse.Cloud.define(
  'rejectcompanynamechange',
  withErrorLogging('rejectcompanynamechange', rejectCompanyNameChange)
);
