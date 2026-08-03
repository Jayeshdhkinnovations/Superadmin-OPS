// API service layer. Mirrors apps/OpenSign's own pattern of talking to its backend
// exclusively through Parse.Cloud.run — see design.md "API Service Layer".
import Parse, { USE_MOCKS } from "./parseClient";
import {
  delay,
  mockCurrentUser,
  getMockStats,
  getMockCompanies,
  getMockCompanyById,
  createMockCompany,
  updateMockCompanyLimit,
  setMockCompanyStatus,
  deleteMockCompany,
  getMockLogs,
  getMockAuditLogs,
} from "./mockData";

export const superAdminService = {
  // Auth — Parse Server's own built-in login, same as OpenSign itself uses
  login: async (email, password) => {
    if (USE_MOCKS) {
      await delay(500);
      if (!email || !password) throw Object.assign(new Error("Invalid credentials"), { status: 401 });
      return mockCurrentUser;
    }
    return Parse.User.logIn(email, password);
  },

  getMe: async () => {
    if (USE_MOCKS) {
      await delay(200);
      return mockCurrentUser;
    }
    return Parse.Cloud.run("getme");
  },

  logout: async () => {
    if (USE_MOCKS) {
      await delay(150);
      return;
    }
    return Parse.User.logOut();
  },

  // Stats
  getStats: async () => {
    if (USE_MOCKS) {
      await delay(500);
      return getMockStats();
    }
    return Parse.Cloud.run("getplatformstats");
  },

  // Logs
  getLogs: async (params) => {
    if (USE_MOCKS) {
      await delay(400);
      return getMockLogs(params);
    }
    return Parse.Cloud.run("getsystemlogs", params);
  },

  // Companies
  getCompanies: async (params) => {
    if (USE_MOCKS) {
      await delay(400);
      return getMockCompanies(params);
    }
    return Parse.Cloud.run("getcompanies", params);
  },

  getCompanyById: async (id) => {
    if (USE_MOCKS) {
      await delay(300);
      return getMockCompanyById(id);
    }
    return Parse.Cloud.run("getcompanybyid", { id });
  },

  createCompany: async (payload) => {
    if (USE_MOCKS) {
      return createMockCompany(payload);
    }
    return Parse.Cloud.run("createcompany", payload);
  },

  updateCompanyLimit: async (id, maxUsers) => {
    if (USE_MOCKS) {
      return updateMockCompanyLimit(id, maxUsers);
    }
    return Parse.Cloud.run("updatecompanylimit", { id, maxUsers });
  },

  suspendCompany: async (id) => {
    if (USE_MOCKS) {
      return setMockCompanyStatus(id, "suspended");
    }
    return Parse.Cloud.run("suspendcompany", { id });
  },

  reactivateCompany: async (id) => {
    if (USE_MOCKS) {
      return setMockCompanyStatus(id, "active");
    }
    return Parse.Cloud.run("reactivatecompany", { id });
  },

  deleteCompany: async (id, confirm) => {
    if (USE_MOCKS) {
      return deleteMockCompany(id, confirm);
    }
    return Parse.Cloud.run("deletecompany", { id, confirm });
  },

  // Audit
  getAuditLogs: async (params) => {
    if (USE_MOCKS) {
      await delay(400);
      return getMockAuditLogs(params);
    }
    return Parse.Cloud.run("getauditlogs", params);
  },

  // Approval requests - users who registered themselves via OpenSign's
  // signup form, waiting for a Super Admin to approve before their
  // company/database actually gets created.
  getApprovalRequests: async (params) => {
    return Parse.Cloud.run("getapprovalrequests", params);
  },

  approveRequest: async (requestId, maxUsers) => {
    return Parse.Cloud.run("approverequest", { requestId, maxUsers });
  },

  rejectRequest: async (requestId) => {
    return Parse.Cloud.run("rejectrequest", { requestId });
  },
};
