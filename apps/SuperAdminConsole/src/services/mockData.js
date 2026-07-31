// In-memory mock fixtures used only while VITE_USE_MOCKS=true (see parseClient.js).
// Lets the console be fully browsable before apps/SuperAdminServer exists.

export const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const NOW = Date.now();
const daysAgo = (d, h = 0) => new Date(NOW - d * 86400000 - h * 3600000).toISOString();

export const mockCurrentUser = {
  objectId: "sa-001",
  email: "ceo@toowix.com",
  name: "Pavithra",
  role: "super_admin",
};

let companies = [
  {
    objectId: "c1",
    companyName: "Jayesh Hospital Pvt Ltd",
    adminEmail: "admin@jayeshhospital.com",
    adminName: "Jayesh Mehta",
    subdomain: "jayeshhospital",
    databaseName: "jayeshhospitalpvtltd",
    containerId: "a1b2c3d4",
    maxUsers: 100,
    currentUserCount: 7,
    documentCount: 212,
    storageBytes: 1.2 * 1024 ** 3,
    status: "active",
    createdAt: daysAgo(3),
  },
  {
    objectId: "c2",
    companyName: "Aurora Legal Services",
    adminEmail: "ops@auroralegal.io",
    adminName: "Renee Ortiz",
    subdomain: "auroralegal",
    databaseName: "auroralegalservices",
    containerId: "f9e8d7c6",
    maxUsers: 25,
    currentUserCount: 25,
    documentCount: 980,
    storageBytes: 4.7 * 1024 ** 3,
    status: "active",
    createdAt: daysAgo(9),
  },
  {
    objectId: "c3",
    companyName: "Northwind Realty Group",
    adminEmail: "admin@northwindrealty.com",
    adminName: "Sam Whitfield",
    subdomain: "northwindrealty",
    databaseName: "northwindrealtygroup",
    containerId: "b3c4d5e6",
    maxUsers: 10,
    currentUserCount: 3,
    documentCount: 44,
    storageBytes: 0.3 * 1024 ** 3,
    status: "suspended",
    createdAt: daysAgo(21),
  },
  {
    objectId: "c4",
    companyName: "Kestrel Finance Co",
    adminEmail: "it@kestrelfinance.com",
    adminName: "Diane Cho",
    subdomain: "kestrelfinance",
    databaseName: "kestrelfinanceco",
    containerId: "12ab34cd",
    maxUsers: 50,
    currentUserCount: 41,
    documentCount: 1523,
    storageBytes: 9.1 * 1024 ** 3,
    status: "active",
    createdAt: daysAgo(45),
  },
  {
    objectId: "c5",
    companyName: "Bluepeak Consulting",
    adminEmail: "admin@bluepeak.co",
    adminName: "Marcus Lee",
    subdomain: "bluepeak",
    databaseName: "bluepeakconsulting",
    containerId: "77aa66bb",
    maxUsers: 15,
    currentUserCount: 15,
    documentCount: 302,
    storageBytes: 1.8 * 1024 ** 3,
    status: "active",
    createdAt: daysAgo(60),
  },
];

let systemLogs = [
  { objectId: "l1", level: "error", message: "OpenSignServer instance failed health check after restart", companyId: "c3", companyName: "Northwind Realty Group", route: "/api/app/health", statusCode: 503, errorCode: "INSTANCE_UNHEALTHY", meta: { attempt: 3, containerId: "b3c4d5e6" }, stack: "Error: connect ECONNREFUSED 127.0.0.1:9114\n    at TCPConnectWrap.afterConnect", createdAt: daysAgo(0, 2) },
  { objectId: "l2", level: "error", message: "Database provisioning timed out during createcompany", companyId: null, companyName: null, route: "/api/superadmin/companies", statusCode: 500, errorCode: "PROVISION_TIMEOUT", meta: { step: "schema-setup" }, stack: "Error: Timed out waiting for mongod\n    at Provisioner.createDatabase", createdAt: daysAgo(0, 6) },
  { objectId: "l3", level: "warn", message: "Company approaching user limit (23/25)", companyId: "c2", companyName: "Aurora Legal Services", route: "/api/app/functions/adduser", statusCode: 200, createdAt: daysAgo(0, 9) },
  { objectId: "l4", level: "info", message: "Instance restarted after reactivate", companyId: "c3", companyName: "Northwind Realty Group", route: "/api/superadmin/companies/reactivate", statusCode: 200, createdAt: daysAgo(1) },
  { objectId: "l5", level: "info", message: "New company provisioned successfully", companyId: "c5", companyName: "Bluepeak Consulting", route: "/api/superadmin/companies", statusCode: 201, createdAt: daysAgo(2) },
  { objectId: "l6", level: "warn", message: "Subdomain route re-registered after Caddy reload", companyId: "c1", companyName: "Jayesh Hospital Pvt Ltd", route: "/internal/proxy/reload", statusCode: 200, createdAt: daysAgo(2, 4) },
  { objectId: "l7", level: "error", message: "Failed to drop database during hard delete rollback", companyId: null, companyName: "Test Co (rolled back)", route: "/api/superadmin/companies/:id", statusCode: 500, errorCode: "ROLLBACK_FAILED", meta: { step: "drop-database" }, stack: "Error: db already dropped\n    at Deprovisioner.dropDatabase", createdAt: daysAgo(4) },
  { objectId: "l8", level: "info", message: "Max users updated", companyId: "c4", companyName: "Kestrel Finance Co", route: "/api/superadmin/companies/:id", statusCode: 200, createdAt: daysAgo(5) },
  { objectId: "l9", level: "info", message: "Super Admin login", companyId: null, companyName: null, route: "/api/app/login", statusCode: 200, createdAt: daysAgo(6) },
  { objectId: "l10", level: "warn", message: "Storage usage above 80% of plan estimate", companyId: "c4", companyName: "Kestrel Finance Co", route: "/internal/usage-check", statusCode: 200, createdAt: daysAgo(7) },
];

let auditLogs = [
  { objectId: "a1", actorEmail: "ceo@toowix.com", action: "company.create", targetId: "c5", targetCompany: "Bluepeak Consulting", before: null, after: { companyName: "Bluepeak Consulting", maxUsers: 15, status: "active" }, createdAt: daysAgo(2) },
  { objectId: "a2", actorEmail: "ceo@toowix.com", action: "company.suspend", targetId: "c3", targetCompany: "Northwind Realty Group", before: { status: "active" }, after: { status: "suspended" }, createdAt: daysAgo(2, 2) },
  { objectId: "a3", actorEmail: "ceo@toowix.com", action: "company.reactivate", targetId: "c3", targetCompany: "Northwind Realty Group", before: { status: "suspended" }, after: { status: "active" }, createdAt: daysAgo(1) },
  { objectId: "a4", actorEmail: "ceo@toowix.com", action: "company.suspend", targetId: "c3", targetCompany: "Northwind Realty Group", before: { status: "active" }, after: { status: "suspended" }, createdAt: daysAgo(0, 12) },
  { objectId: "a5", actorEmail: "ceo@toowix.com", action: "company.update_limit", targetId: "c4", targetCompany: "Kestrel Finance Co", before: { maxUsers: 40 }, after: { maxUsers: 50 }, createdAt: daysAgo(5) },
  { objectId: "a6", actorEmail: "ceo@toowix.com", action: "company.create", targetId: "c4", targetCompany: "Kestrel Finance Co", before: null, after: { companyName: "Kestrel Finance Co", maxUsers: 40, status: "active" }, createdAt: daysAgo(45) },
  { objectId: "a7", actorEmail: "ceo@toowix.com", action: "company.create", targetId: "c3", targetCompany: "Northwind Realty Group", before: null, after: { companyName: "Northwind Realty Group", maxUsers: 10, status: "active" }, createdAt: daysAgo(21) },
  { objectId: "a8", actorEmail: "ceo@toowix.com", action: "company.create", targetId: "c2", targetCompany: "Aurora Legal Services", before: null, after: { companyName: "Aurora Legal Services", maxUsers: 25, status: "active" }, createdAt: daysAgo(9) },
  { objectId: "a9", actorEmail: "ceo@toowix.com", action: "company.create", targetId: "c1", targetCompany: "Jayesh Hospital Pvt Ltd", before: null, after: { companyName: "Jayesh Hospital Pvt Ltd", maxUsers: 100, status: "active" }, createdAt: daysAgo(3) },
];

const uid = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

function pushAudit(action, company, before, after) {
  auditLogs = [
    {
      objectId: uid("a"),
      actorEmail: mockCurrentUser.email,
      action,
      targetId: company.objectId,
      targetCompany: company.companyName,
      before,
      after,
      createdAt: new Date().toISOString(),
    },
    ...auditLogs,
  ];
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

function paginate(list, page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return {
    results: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

export function getMockStats() {
  const active = companies.filter((c) => c.status === "active").length;
  const suspended = companies.filter((c) => c.status === "suspended").length;
  const totalUsers = companies.reduce((s, c) => s + c.currentUserCount, 0);
  const totalDocuments = companies.reduce((s, c) => s + c.documentCount, 0);
  const totalStorageBytes = companies.reduce((s, c) => s + c.storageBytes, 0);
  const errorCountLast24h = systemLogs.filter(
    (l) => l.level === "error" && Date.now() - new Date(l.createdAt).getTime() < 86400000
  ).length;
  const recentSignups = [...companies]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((c) => ({
      objectId: c.objectId,
      companyName: c.companyName,
      adminEmail: c.adminEmail,
      maxUsers: c.maxUsers,
      createdAt: c.createdAt,
    }));

  return {
    totalCompanies: companies.length,
    activeCompanies: active,
    suspendedCompanies: suspended,
    totalUsers,
    totalDocuments,
    totalStorageBytes,
    recentSignups,
    errorCountLast24h,
  };
}

export function getMockCompanies({ search = "", status = "all", page = 1, pageSize = 10 } = {}) {
  let list = companies;
  if (status !== "all") list = list.filter((c) => c.status === status);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) => c.companyName.toLowerCase().includes(q) || c.adminEmail.toLowerCase().includes(q)
    );
  }
  list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return paginate(list, page, pageSize);
}

export function getMockCompanyById(id) {
  const company = companies.find((c) => c.objectId === id);
  if (!company) throw makeError(404, "NOT_FOUND", "Company not found");
  return company;
}

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export async function createMockCompany(payload, onProgress) {
  const steps = ["Creating database", "Setting up structure", "Starting instance", "Registering domain"];
  for (const step of steps) {
    onProgress?.(step);
    await delay(550);
  }
  const company = {
    objectId: uid("c"),
    companyName: payload.companyName,
    adminEmail: payload.adminEmail,
    adminName: payload.adminName,
    subdomain: slugify(payload.companyName),
    databaseName: slugify(payload.companyName),
    containerId: uid("").slice(0, 8),
    maxUsers: payload.maxUsers,
    currentUserCount: 1,
    documentCount: 0,
    storageBytes: 0,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  companies = [company, ...companies];
  pushAudit("company.create", company, null, {
    companyName: company.companyName,
    maxUsers: company.maxUsers,
    status: company.status,
  });
  return company;
}

export async function updateMockCompanyLimit(id, maxUsers) {
  await delay(350);
  const company = companies.find((c) => c.objectId === id);
  if (!company) throw makeError(404, "NOT_FOUND", "Company not found");
  const before = { maxUsers: company.maxUsers };
  company.maxUsers = maxUsers;
  pushAudit("company.update_limit", company, before, { maxUsers });
  return company;
}

export async function setMockCompanyStatus(id, status) {
  await delay(600);
  const company = companies.find((c) => c.objectId === id);
  if (!company) throw makeError(404, "NOT_FOUND", "Company not found");
  const before = { status: company.status };
  company.status = status;
  pushAudit(status === "suspended" ? "company.suspend" : "company.reactivate", company, before, { status });
  return company;
}

export async function deleteMockCompany(id, confirm) {
  const company = companies.find((c) => c.objectId === id);
  if (!company) throw makeError(404, "NOT_FOUND", "Company not found");
  if (confirm !== company.companyName) {
    throw makeError(422, "CONFIRM_MISMATCH", "Company name confirmation did not match");
  }
  await delay(700);
  companies = companies.filter((c) => c.objectId !== id);
  pushAudit("company.delete", company, { status: company.status }, null);
  return { success: true };
}

export function getMockLogs({ level = "all", company = "", message = "", from = "", to = "", page = 1, pageSize = 15 } = {}) {
  let list = systemLogs;
  if (level !== "all") list = list.filter((l) => l.level === level);
  if (company) {
    const q = company.toLowerCase();
    list = list.filter((l) => l.companyName?.toLowerCase().includes(q));
  }
  if (message) {
    const q = message.toLowerCase();
    list = list.filter((l) => l.message.toLowerCase().includes(q));
  }
  if (from) list = list.filter((l) => new Date(l.createdAt) >= new Date(from));
  if (to) list = list.filter((l) => new Date(l.createdAt) <= new Date(to));
  list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return paginate(list, page, pageSize);
}

export function getMockAuditLogs({ actor = "", action = "all", from = "", to = "", page = 1, pageSize = 15 } = {}) {
  let list = auditLogs;
  if (actor) {
    const q = actor.toLowerCase();
    list = list.filter((l) => l.actorEmail.toLowerCase().includes(q));
  }
  if (action !== "all") list = list.filter((l) => l.action === action);
  if (from) list = list.filter((l) => new Date(l.createdAt) >= new Date(from));
  if (to) list = list.filter((l) => new Date(l.createdAt) <= new Date(to));
  list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return paginate(list, page, pageSize);
}
