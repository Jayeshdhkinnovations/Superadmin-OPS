// Plain JavaScript throughout — shapes documented via JSDoc for editor hints only,
// not enforced at runtime. See design.md "Data Shapes".

/**
 * @typedef {Object} PlatformStats
 * @property {number} totalCompanies
 * @property {number} activeCompanies
 * @property {number} suspendedCompanies
 * @property {number} totalUsers
 * @property {number} totalDocuments
 * @property {number} totalStorageBytes
 * @property {RecentCompanySignup[]} recentSignups
 * @property {number} errorCountLast24h
 */

/**
 * @typedef {Object} RecentCompanySignup
 * @property {string} objectId
 * @property {string} companyName
 * @property {string} adminEmail
 * @property {number} maxUsers
 * @property {string} createdAt
 */

/**
 * @typedef {'info'|'warn'|'error'} LogLevel
 * @typedef {Object} SystemLog
 * @property {string} objectId
 * @property {LogLevel} level
 * @property {string} message
 * @property {string} [companyId]
 * @property {string} [companyName]
 * @property {string} [route]
 * @property {number} [statusCode]
 * @property {string} [errorCode]
 * @property {string} [stack]
 * @property {Object} [meta]
 * @property {string} createdAt
 */

/**
 * @typedef {'active'|'suspended'|'provisioning'|'failed'} CompanyStatus
 * @typedef {Object} CompanySummary
 * @property {string} objectId
 * @property {string} companyName
 * @property {string} adminEmail
 * @property {string} subdomain
 * @property {string} databaseName
 * @property {string} containerId
 * @property {number} maxUsers
 * @property {number} currentUserCount
 * @property {number} documentCount
 * @property {number} storageBytes
 * @property {CompanyStatus} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} CreateCompanyPayload
 * @property {string} companyName
 * @property {string} adminEmail
 * @property {string} adminName
 * @property {number} maxUsers
 */

/**
 * @typedef {Object} AuditLog
 * @property {string} objectId
 * @property {string} actorEmail
 * @property {string} action
 * @property {string} targetId
 * @property {string} [targetCompany]
 * @property {Object} [before]
 * @property {Object} [after]
 * @property {string} createdAt
 */

export {};
