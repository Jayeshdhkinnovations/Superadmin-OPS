# Design Document

## OpenSign Super Admin Console — SaaS Provisioning Control Panel
**Standalone application · Target domain: `admin.yourbrand.com`**
**Version:** 1.0 · July 2026

---

## Overview

The Super Admin Console is a completely separate application from OpenSign itself. It is used exclusively by the CEO (and future platform operators) to onboard new companies onto the platform. It shares nothing with any individual company's OpenSign instance — no code, no database, no login system. It only *creates and manages* those instances from the outside.

**Four screens:**
1. **Overview Dashboard** (`/overview`) — Platform-wide KPI cards, recent company signups, error summary
2. **Logs Viewer** (`/logs`) — Paginated, filterable system/provisioning log table with expandable error rows
3. **Company Management** (`/companies`) — Full company CRUD: create, edit user limit, suspend/reactivate, hard delete with type-to-confirm
4. **Audit Log** (`/audit`) — Read-only, append-only history of every Super Admin action

**Stack:** the exact same stack OpenSign itself already runs on — no new frameworks introduced anywhere in this project:
- **Frontend:** React 19 + Vite (same as `apps/OpenSign`) · React Router · Tailwind CSS + daisyUI · Redux Toolkit / Zustand · Axios · Parse JS SDK
- **Backend:** Node.js + Express + **Parse Server** (same as `apps/OpenSignServer`) — the Control Plane API is built the same way OpenSignServer itself is built: an Express app with a mounted Parse Server instance, cloud functions for the real logic, ES modules throughout
- **Database:** MongoDB — same database technology, same MongoDB deployment/server OpenSign already uses. The Control Plane keeps its **own separate database** on that same server (for isolation reasons — explained below), not a different database technology
- **Auth:** Parse Server's own built-in `Parse.User` login system (the exact same login mechanism every OpenSign instance already uses) — no Firebase, no hand-rolled JWT library, no external identity provider

---

## Architecture

### Repository and Deployment

```
apps/SuperAdminConsole/          ← new folder in the SAME OpenSign monorepo,
                                    built exactly like apps/OpenSign
├── src/
│   ├── main.jsx                  ← same entry pattern as apps/OpenSign
│   ├── App.jsx                   ← React Router routes + AuthProvider
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── AccessDenied.jsx
│   │   ├── Overview.jsx
│   │   ├── Logs.jsx
│   │   ├── Companies.jsx
│   │   └── AuditLog.jsx
│   ├── components/
│   │   ├── layout/               ← Sidebar, TopBar, DesktopGate, ProtectedRoute
│   │   ├── overview/              ← StatCard, RecentSignupsList, ErrorCard
│   │   ├── logs/                  ← LogTable, LogFilters, LogDetailRow
│   │   ├── companies/             ← CompanyTable, CompanyFilters, DetailDrawer,
│   │   │                             CreateCompanyModal, EditLimitModal,
│   │   │                             SuspendDialog, DeleteDialog
│   │   └── audit/                 ← AuditTable, AuditFilters, AuditDiffRow
│   ├── services/                  ← Parse SDK init + all API call functions
│   ├── hooks/                     ← useAuth, useDesktopOnly, useDebounce
│   └── store/                     ← Redux/Zustand slices (same pattern as apps/OpenSign)
├── vite.config.js                 ← same Vite setup as apps/OpenSign
├── tailwind.config.js              ← same Tailwind/daisyUI config as apps/OpenSign
├── package.json
└── .env
```

This sits as a sibling folder to `apps/OpenSign` and `apps/OpenSignServer` in the same monorepo — same build tooling, same lint/prettier config, same component conventions — just its own separate deployable app, on its own domain.

### The Control Plane Backend (new — this is the part that doesn't exist in a normal admin dashboard)

This console needs its own small backend — separate from every company's OpenSignServer instance, since its job is to *create and destroy* whole instances, not to serve one. We'll call it the **Control Plane API** — and it's built exactly the same way `apps/OpenSignServer` is: an Express app with a mounted Parse Server, cloud functions holding the real logic, same `package.json` dependency set (`parse-server`, `express`, `cors`, `dotenv`).

```
apps/SuperAdminServer/           ← new folder in the SAME monorepo, built exactly
                                    like apps/OpenSignServer
├── index.js                     ← Express app + ParseServer mount, own port (e.g. 9000)
├── cloud/
│   ├── main.js                  ← registers every cloud function below
│   ├── createCompany.js         ← the full provisioning chain
│   ├── deleteCompany.js         ← the full deprovisioning chain
│   ├── suspendCompany.js
│   ├── reactivateCompany.js
│   ├── updateCompanyLimit.js
│   ├── getStats.js
│   ├── getLogs.js
│   └── getAuditLogs.js
├── services/
│   ├── dockerManager.js         ← starts/stops/removes OpenSignServer containers
│   └── proxyManager.js          ← updates Caddy's routing config
├── Utils.js                     ← same pattern as OpenSignServer's Utils.js
├── package.json
└── .env
```

**Its own database** — same MongoDB server OpenSign already runs on, but its own separate database name (e.g. `SuperAdminDB`), holding Parse's standard classes plus our own: `_User` (Super Admin logins — literally Parse's built-in user class, same as every OpenSign instance uses), `Company` (name, database name, container ID, subdomain, max users, status), `SystemLog`, and `AuditLog`. Nothing about any company's actual documents/signatures ever lives here — only "which companies exist and how to reach them." Kept as its own database (not merged into any company's data) purely for isolation — same database *technology* and *server*, just a separate namespace, same principle we already use to keep every company's own data separate from each other.

### Request Flow

```
Browser → Console (admin.yourbrand.com) — React + Vite, same as apps/OpenSign
  → ProtectedRoute component (checks Parse.User.current(); redirects /login if absent)
  → Page component (same data-fetching pattern as apps/OpenSign — Parse.Cloud.run)
  → Parse JS SDK (same SDK OpenSign's own frontend already uses)
  → Control Plane API (controlplane.yourbrand.com) — Express + Parse Server
    → Parse Server's own session-token verification → requireSuperAdmin cloud-function
      guard → cloud function
    → SuperAdminDB (companies list, logs, audit — via Parse.Query, same as OpenSign)
    → Docker (start/stop/remove company containers)
    → Caddy (update routing rules)
```

---

## The Core New Mechanic: Provisioning a Company

This is the part with no equivalent in a typical admin dashboard — creating a company here means standing up a real, working, isolated OpenSign instance, not just adding a database row.

### Provisioning Flow (what happens when "Create Company" is clicked)

```
1. Super Admin submits: Company Name, Admin Email, Max Users
2. Control Plane API validates input, generates:
     - a safe database name   (e.g. "jayeshhospitalpvtltd")
     - a subdomain slug       (e.g. "jayeshhospital")
3. Creates a brand-new, empty MongoDB database with that name
4. Runs OpenSign's own schema-setup tool against the new database
   (the same migration tool OpenSignServer already runs on every startup)
5. Inserts into the new database:
     - the Admin's login (_User)
     - the company's Tenant record (partners_Tenant) — including the new
       MaxUsers field, set to whatever the Super Admin typed
     - Organization, Team, and the Admin's profile (contracts_Users)
   (this is the exact same chain that already happens automatically during
   normal OpenSign sign-up — just triggered by the Super Admin instead)
6. Starts a new Docker container running OpenSignServer, configured
   (via environment variables) to connect to this new database
7. Registers a new route in Caddy: <subdomain>.yourbrand.com → this
   container's port
8. Saves the company's record into ControlPlaneDB: name, database name,
   container ID, port, subdomain, admin email, max users, status: active
9. Writes an audit log entry: company.create
10. Sends the Admin their login details (email + temporary password)
```

### Deprovisioning Flow (hard delete)

```
1. Super Admin clicks Delete, types the company's exact name to confirm
2. Control Plane API stops and removes that company's Docker container
3. Drops their MongoDB database entirely
4. Removes their route from Caddy
5. Removes their entry from ControlPlaneDB
6. Writes an audit log entry: company.delete
```

### Suspend / Reactivate Flow

```
Suspend:     stop the company's Docker container (database is left intact,
             untouched) → remove/pause their route in Caddy → their URL
             now shows a "this account is suspended" page instead
Reactivate:  restart their container → restore their route in Caddy
```

### User Limit Enforcement (lives inside OpenSignServer itself, not this console)

This is the one piece of new logic that has to be added to the actual OpenSign codebase every company runs (not to the Super Admin console):

- One new field on `partners_Tenant`: `MaxUsers`
- One new check inside the existing "add user" cloud function: before creating a new user profile under a Tenant, count how many `contracts_Users` profiles already exist for that Tenant. If the count is already at or above `MaxUsers`, reject the request with a clear "user limit reached" message instead of creating the account.

---

## Authentication Architecture

### Login Flow

Uses Parse Server's own built-in login — the exact same mechanism every OpenSign instance already uses for its own users, via the same Parse JS SDK call the OpenSign frontend already makes (`Parse.User.logIn`).

```
1. Super Admin opens https://admin.yourbrand.com/login
2. Enters email + password
3. Console calls Parse.User.logIn(email, password) via the Parse JS SDK,
   pointed at the Control Plane API's Parse Server mount
4. Parse Server: verifies credentials against its own _User class in
   SuperAdminDB (same password-hashing Parse Server already does for
   every OpenSign instance) — issues a sessionToken on success
5. Console: stores the sessionToken exactly as OpenSign's own frontend
   already does (Parse SDK handles this automatically)
6. Console: calls a `getMe` cloud function → confirms this user has the
   `super_admin` role before rendering any protected page
7. Console: redirects to /overview
```

There is deliberately **no sign-up form and no API endpoint that can create a Super Admin account.** The only Super Admin account(s) are seeded directly into `SuperAdminDB`'s `_User` class ahead of time — the same way OpenSign itself only ever creates its very first admin through a one-time setup screen, never an open sign-up.

### `ProtectedRoute` component — Route Protection

Same pattern as any React Router–protected app (no Next.js middleware needed, since this is a Vite SPA like `apps/OpenSign`):

```jsx
// src/components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router";
import Parse from "parse";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute() {
  const { isLoading, isSuperAdmin } = useAuth();

  if (isLoading) return null; // or a loading skeleton
  if (!Parse.User.current()) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/access-denied" replace />;

  return <Outlet />;
}
```

```jsx
// src/App.jsx (routes)
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/access-denied" element={<AccessDenied />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/overview" element={<Overview />} />
    <Route path="/logs" element={<Logs />} />
    <Route path="/companies" element={<Companies />} />
    <Route path="/audit" element={<AuditLog />} />
  </Route>
</Routes>
```

---

## Layout Components

### `ConsoleLayout`

```
┌───────────────────────────────────────────────────────────────┐
│  TopBar   [OpenSign Super Admin]        [user email] [Logout] │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                    │
│ Sidebar  │   <main> — page content                           │
│          │                                                    │
│ Overview │                                                    │
│ Logs     │                                                    │
│ Companies│                                                    │
│ Audit    │                                                    │
│          │                                                    │
└──────────┴──────────────────────────────────────────────────────┘
```

- Fixed left sidebar, fixed top bar, minimum supported viewport: `1024px` (desktop-only tool — the tables and drawers on this console are not designed for mobile use).

### Sidebar nav items

```javascript
const NAV_ITEMS = [
  { label: 'Overview',   href: '/overview',  icon: LayoutDashboard },
  { label: 'Logs',       href: '/logs',      icon: FileText        },
  { label: 'Companies',  href: '/companies', icon: Building2       },
  { label: 'Audit Log',  href: '/audit',     icon: ClipboardList   },
];
```

---

## Data Shapes — `src/types/superadmin.js`

Plain JavaScript throughout, same as the rest of OpenSign's frontend (no TypeScript anywhere in this project) — shapes documented here via JSDoc comments for clarity, not enforced types:

```javascript
/**
 * @typedef {Object} PlatformStats
 * @property {number} totalCompanies
 * @property {number} activeCompanies
 * @property {number} suspendedCompanies
 * @property {number} totalUsers          - sum across every company's user count
 * @property {number} totalDocuments      - sum across every company's signed documents
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
 * @property {string} [companyId]   - present when the log relates to one company
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
 * @property {number} maxUsers
 * @property {number} currentUserCount
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
 * @property {string} action        - e.g. 'company.create', 'company.suspend'
 * @property {string} targetId
 * @property {Object} [before]
 * @property {Object} [after]
 * @property {string} createdAt
 */
```

---

## API Service Layer — `src/services/superadmin.js`

Uses the Parse JS SDK's `Parse.Cloud.run`, the exact same way `apps/OpenSign`'s own frontend already talks to its backend (see e.g. `Parse.Cloud.run("getdrive", ...)` calls throughout OpenSign's codebase) — **not** raw REST/axios calls:

```javascript
// src/services/superadmin.js
import Parse from "parse";

export const superAdminService = {
  // Auth — Parse Server's own built-in login, same as OpenSign itself uses
  login: (email, password) => Parse.User.logIn(email, password),
  getMe: () => Parse.Cloud.run("getme"),
  logout: () => Parse.User.logOut(),

  // Stats
  getStats: () => Parse.Cloud.run("getplatformstats"),

  // Logs
  getLogs: (params) => Parse.Cloud.run("getsystemlogs", params),

  // Companies
  getCompanies: (params) => Parse.Cloud.run("getcompanies", params),
  getCompanyById: (id) => Parse.Cloud.run("getcompanybyid", { id }),
  createCompany: (payload) => Parse.Cloud.run("createcompany", payload),
  updateCompanyLimit: (id, maxUsers) => Parse.Cloud.run("updatecompanylimit", { id, maxUsers }),
  suspendCompany: (id) => Parse.Cloud.run("suspendcompany", { id }),
  reactivateCompany: (id) => Parse.Cloud.run("reactivatecompany", { id }),
  deleteCompany: (id, confirm) => Parse.Cloud.run("deletecompany", { id, confirm }),

  // Audit
  getAuditLogs: (params) => Parse.Cloud.run("getauditlogs", params),
};
```

Every one of these (`createcompany`, `deletecompany`, etc.) is a Parse Cloud Function registered in `apps/SuperAdminServer/cloud/main.js` — the identical pattern OpenSignServer already uses for every one of its own features (`Parse.Cloud.define('createcompany', createCompany)`, same as `Parse.Cloud.define('adduser', addUser)` already does today).

---

## Screen Designs

### Screen 1: Overview Dashboard (`/overview`)

```
Row 1: [Stat Cards]
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │Total Companies│ │ Total Users  │ │Total Documents│
  │     24       │ │     318      │ │    4,981      │
  │  1 suspended │ │              │ │              │
  └──────────────┘ └──────────────┘ └──────────────┘
  ┌──────────────┐ ┌──────────────┐
  │ Storage Used │ │ Errors (24h) │
  │   18.4 GB    │ │      2       │
  └──────────────┘ └──────────────┘

Row 2:
  ┌───────────────────┐ ┌──────────────┐
  │ Recent Signups     │ │ Error Card   │
  │ (last 5-10)        │ │ 2 errors/24h │
  │ [company][admin]   │ │ → View Logs  │
  └───────────────────┘ └──────────────┘
```

### Screen 2: Logs Viewer (`/logs`)

**Filter bar:** `[Level ▾] [From date] [To date] [Company search] [Message search] [Clear]`

**Table columns:** Timestamp | Level badge | Company (if applicable) | Route | Status | Message (truncated)

**Expandable error row:** full message, error code, meta JSON, stack trace (dev only).

### Screen 3: Company Management (`/companies`) — the core screen

**Action button:** `[+ Create Company]`

**Filter bar:** `[Search company or admin email]` `[Status: All ▾]`

**Table columns:** Company Name | Admin Email | Subdomain | Users (e.g. "7 / 10") | Storage | Status | Created | Actions

**Per-row actions:** View · Edit Limit · Suspend/Reactivate · Delete

**Create Company Modal:**
```
┌──────────────────────────────────────────┐
│  Create New Company                       │
│                                            │
│  Company Name:  [________________]        │
│  Admin Name:    [________________]        │
│  Admin Email:   [________________]        │
│  Max Users:     [____]                     │
│                                            │
│  [Cancel]                    [Create]     │
└──────────────────────────────────────────┘
```
On submit, shows a progress state ("Creating database... Setting up
structure... Starting instance... Registering domain...") since
provisioning takes a few seconds, not instant like a normal form save.

**Detail Drawer:**
```
┌──────────────────────────────────┐
│  Jayesh Hospital Pvt Ltd          │
│  admin@jayeshhospital.com         │
│  Subdomain: jayeshhospital        │
│  Created: Jul 24, 2026            │
├──────────────────────────────────┤
│  Usage                            │
│  Users:      7 / 100              │
│  Documents:  212                  │
│  Storage:    1.2 GB               │
├──────────────────────────────────┤
│  Instance                         │
│  Database:  jayeshhospitalpvtltd  │
│  Container: a1b2c3d4              │
│  Status:    ● Active              │
└──────────────────────────────────┘
```

**Delete Confirm Dialog:**
```
┌──────────────────────────────────────────────┐
│  ⚠  Permanently delete this company?          │
│                                                │
│  This will permanently:                       │
│  • Stop and remove their running instance     │
│  • Delete their entire database               │
│  • Delete all 212 documents and files          │
│  • Remove their subdomain                     │
│                                                │
│  This action cannot be undone.                │
│                                                │
│  Type "Jayesh Hospital Pvt Ltd" to confirm:   │
│  [________________________]                   │
│                                                │
│  [Cancel]   [Delete permanently — disabled]   │
└──────────────────────────────────────────────┘
```

### Screen 4: Audit Log Viewer (`/audit`)

**Table columns:** Timestamp | Actor | Action badge (`company.create`, `company.suspend`, etc.) | Target Company | Target ID

**Expandable diff row:** before/after JSON, changed fields highlighted.

No edit or delete controls anywhere on this screen — ever.

---

## Error Handling

| Scenario | Response | UI Behaviour |
|---|---|---|
| 401 on any API call | Token expired/invalid | Clear cookie → redirect `/login` |
| 403 `FORBIDDEN_SUPER_ADMIN_REQUIRED` | Not a Super Admin | Show Access Denied screen |
| Provisioning step fails mid-way (e.g. Docker start fails after DB created) | Partial failure | Roll back what succeeded (drop the DB, remove the route) so no orphaned half-created company is left behind; log the failure; show a clear error to the Super Admin |
| 5xx / network error on query | Backend down | Inline error state, Retry button |
| 422 on delete (name mismatch) | Safety net | Error toast: "Company name confirmation did not match" |
| Empty query results | No data | Contextual empty state with "Clear filters" |

---

## Testing Strategy

### Unit tests
- `CreateCompanyModal` — Max Users field rejects 0 and negative numbers
- `DeleteDialog` — Delete button disabled until exact company name match; enabled on match
- `LogTable` — `error` rows expand on click; `info`/`warn` rows do not
- `AuditDiffRow` — renders before/after JSON; no edit/delete buttons present
- `DesktopGate` hook — returns `true` below 1024px

### Property-based tests
See Correctness Properties in `requirements.md` — these are the priority test targets, especially around provisioning atomicity and user-limit enforcement.

---

*OpenSign Super Admin Console · Design Document · v1.0 · July 2026*
