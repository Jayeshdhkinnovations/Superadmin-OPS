# Requirements Document

> **Feature:** OpenSign Super Admin Console — SaaS Company Provisioning Panel

**Project:** OpenSign Super Admin Console
**Type:** Standalone application — separate repository, separate domain, separate backend
**Target Domain:** `admin.yourbrand.com`
**Version:** 1.0 · July 2026

> **Stack:** The exact same stack OpenSign itself runs on, no new frameworks introduced — **Frontend:** React 19 + Vite (same as `apps/OpenSign`) · React Router · Tailwind CSS + daisyUI · Axios/Parse JS SDK · plain JavaScript (no TypeScript, matching the rest of the codebase). **Backend:** Node.js + Express + Parse Server (same as `apps/OpenSignServer`), ES modules throughout.
> **Auth:** Parse Server's own built-in `Parse.User` login system — the identical login mechanism every OpenSign instance already uses. No Firebase, no hand-rolled JWT/bcrypt, no external identity provider — no company's OpenSign instance is touched by this login system.
> **Backend:** A new, separate "Control Plane API," built as its own Parse Server + Express app — not the same *running instance* any company's OpenSign uses, but the same *codebase pattern*. Super Admin cloud functions are protected by a `requireSuperAdmin()` guard, mirroring the role-check pattern already used elsewhere in OpenSign's own cloud code.
> **Database:** MongoDB — the same database technology and the same MongoDB server/deployment OpenSign already runs on. The Control Plane keeps its own separate database name for isolation (same principle already used to keep every company's data separate from every other company's).
> **Deployment:** Own domain, own deployment. Lives as a sibling folder in the same monorepo as `apps/OpenSign` and `apps/OpenSignServer`, but is its own independently deployable app — NOT part of any company's OpenSign codebase or runtime.

---

## Introduction

The Super Admin Console is a standalone internal tool used exclusively by the CEO (and future platform operators) to onboard, monitor, and offboard companies on the OpenSign platform. It is deployed to its own domain (`admin.yourbrand.com`), completely separate from every individual company's OpenSign instance (e.g. `jayeshhospital.yourbrand.com`).

The console provides four primary functions: a Platform Overview Dashboard (company counts, user counts, storage, recent signups, errors), a System Logs Viewer, a Company Management screen (the core feature — full provisioning/deprovisioning of entire OpenSign instances per company, with a user limit per company), and a read-only Audit Log Viewer.

**Why a separate project?** The console's job — creating and destroying entire databases and running backend instances — is fundamentally different from anything inside OpenSign itself. Keeping it separate means a bug or compromise in one company's OpenSign instance can never reach the tool that controls every company, and vice versa.

**Super Admin provisioning:** There is no sign-up form and no API endpoint capable of creating a Super Admin account. The only Super Admin account(s) are seeded directly into the Control Plane database ahead of time. The `role` field is always read from that stored record — never from client input.

**Core difference from a typical admin dashboard:** "creating a company" here does not mean adding a database row. It means: creating a brand-new database, building it with OpenSign's own structure, starting a dedicated running instance of OpenSign pointed at it, and wiring up a subdomain to reach it. This is a genuine infrastructure-provisioning action, not a form save — and it must be treated with the atomicity and rollback care that implies.

---

## Glossary

| Term | Definition |
|------|-----------|
| **Super_Admin** | A platform operator account, seeded directly into the Control Plane database. Has access to all Super Admin Console screens. |
| **Company** | One customer/tenant of the OpenSign platform. Each Company has its own dedicated database, its own running OpenSignServer instance, and its own subdomain. Analogous to a "customer account" in a typical SaaS admin panel, but represents a whole isolated instance rather than a single user record. |
| **Console** | The Super Admin Console web application, deployed at `admin.yourbrand.com`. |
| **Control_Plane_API** | A separate Parse Server + Express app (built the same way `apps/OpenSignServer` is built) that powers the Console — handles Super Admin login (via Parse Server's own `_User` class), company provisioning/deprovisioning cloud functions, logs, and audit history. Not the same running instance as any company's OpenSignServer, but the same underlying technology. |
| **Control_Plane_DB** | The MongoDB database used only by the Control Plane API — same MongoDB server/deployment OpenSign already runs on, own separate database name. Stores the list of companies and their metadata (database name, container ID, subdomain, user limit, status), Super Admin `_User` records, system logs, and audit logs. Contains no company's actual documents, signatures, or user data. |
| **sessionToken** | Parse Server's own built-in session credential, issued on `Parse.User.logIn()` and used by the Parse JS SDK automatically on every subsequent cloud function call — the identical session mechanism every OpenSign instance already relies on. Replaces any need for a custom JWT. |
| **requireSuperAdmin()** | A guard at the top of every Super Admin cloud function (mirroring the role-check pattern already used elsewhere in OpenSign's own cloud code) that throws a `FORBIDDEN_SUPER_ADMIN_REQUIRED` Parse error if the calling user's role is not `super_admin`. |
| **Provisioning** | The multi-step process of creating a new Company: new database → schema setup → Tenant/Admin records → running instance → subdomain routing. |
| **Deprovisioning** | The multi-step process of permanently removing a Company: stop/remove instance → drop database → remove subdomain routing. |
| **MaxUsers** | A number stored on a Company's Tenant record, set by the Super Admin at creation (or edited later), enforced by that Company's own OpenSignServer instance when adding new users. |
| **system_logs** | Collection in Control_Plane_DB storing platform-level and provisioning-related log entries. TTL-purged after 30 days. |
| **audit_logs** | Collection in Control_Plane_DB storing immutable records of every Super Admin action (create/edit/suspend/reactivate/delete a company). Append-only — never modified or deleted. |
| **Stat_Card** | A single KPI display component on the Overview Dashboard. |
| **Detail_Drawer** | A slide-in panel showing a Company's full profile, usage stats, and instance status. |
| **Confirm_Dialog** | A modal requiring the operator to type the target Company's exact name before a hard-delete proceeds. |

---

> **Note on endpoint notation used below:** for readability, Requirements 3–10 refer to backend operations using REST-style names like `GET /api/superadmin/stats` or `DELETE /api/superadmin/companies/:id`. Since the Control_Plane_API is a Parse Server app (not a plain REST API), every one of these is implemented as a **Parse Cloud Function** called via `Parse.Cloud.run(...)` from the Console — e.g. `GET /api/superadmin/stats` means `Parse.Cloud.run("getplatformstats")`, `DELETE /api/superadmin/companies/:id` means `Parse.Cloud.run("deletecompany", { id, confirm })`. This is the same pattern already used for every feature in `apps/OpenSignServer` (e.g. its existing `getdrive`, `adduser`, `checkadminexist` cloud functions). The REST-style names below exist only to describe *what each operation does*, not the literal transport.

## Requirements

---

### Requirement 1: Project Setup — Standalone Repository and Environment

**User Story:** As a platform operator, I want the Super Admin Console deployed as a completely separate application on its own domain, so that it is independently deployable and has no shared code or data with any company's OpenSign instance.

#### Acceptance Criteria

1. THE Console SHALL be a standalone React 19 + Vite project — built with the exact same tooling, conventions, and dependency choices as `apps/OpenSign` (React Router, Tailwind + daisyUI, plain JavaScript, Parse JS SDK) — living as its own folder in the same monorepo, completely separate in *runtime* from any company's OpenSign instance.
2. THE Console SHALL be deployed to its own domain (`admin.yourbrand.com`) and SHALL NOT share a running deployment, database, or domain with any company's OpenSign instance.
3. THE Console SHALL maintain its own `.env` file containing: the Control Plane API's server URL and app ID (same `REACT_APP_SERVERURL` / `APP_ID` pattern `apps/OpenSign` already uses), and no credentials for any individual company's database.
4. THE Console SHALL be written in plain JavaScript (JSX), matching `apps/OpenSign` — no TypeScript is introduced anywhere in this project.
5. THE Control_Plane_API SHALL be its own Parse Server + Express application — built the same way `apps/OpenSignServer` is built — using its own dedicated database (`Control_Plane_DB`) on the same MongoDB server, physically separate from every Company's own OpenSign database.
6. THE Console SHALL NOT contain any link, route, or reference to any individual company's OpenSign instance UI, and no company's OpenSign instance SHALL contain any link or reference to the Console domain.

---

### Requirement 2: Authentication — Super Admin Login

**User Story:** As a Super Admin, I want to log in with a dedicated account and have my role verified before accessing any console screen, so that only authorised operators can provision or destroy company instances.

#### Acceptance Criteria

1. WHEN a user submits valid email/password credentials on the Console login page, THE Console SHALL call `Parse.User.logIn(email, password)` via the Parse JS SDK — the exact same call OpenSign's own frontend already uses — against the Control_Plane_API's Parse Server mount. Parse Server SHALL verify the password against its own `_User` class and, if valid, issue a `sessionToken` (handled automatically by the Parse SDK, same as every OpenSign login already works). IF the credentials are invalid, Parse Server SHALL reject the login without creating any session.
2. WHEN login succeeds, THE Console SHALL call a `getme` cloud function and verify that the returned `role` is `super_admin` before rendering any protected route.
3. IF the authenticated account's `role` is not `super_admin`, THEN THE Console SHALL display an "Access Denied" screen and SHALL NOT render any console content.
4. IF no current Parse session exists (`Parse.User.current()` is null) or the session token is invalid/expired on any protected route, THEN THE Console SHALL redirect to `/login`.
5. WHEN a Super Admin logs out, THE Console SHALL call `Parse.User.logOut()` (the same call OpenSign's own frontend already uses to invalidate a session) then redirect to `/login`.
6. THERE SHALL exist no cloud function, UI form, or code path capable of creating a new Super Admin account. Super Admin `_User` records are seeded directly into `Control_Plane_DB` only, the same way OpenSign itself only ever creates its very first admin through a one-time setup screen.
7. THE Console SHALL display a "Super Admin console is only available on desktop" message on screens narrower than 1024px and SHALL NOT render any console UI on those screen sizes.

---

### Requirement 3: Platform Overview Dashboard (`/overview`)

**User Story:** As a Super Admin, I want to see a real-time overview of every company on the platform, so that I can monitor overall platform health at a glance.

#### Acceptance Criteria

1. WHEN a Super Admin navigates to the Overview Dashboard, THE Console SHALL display Stat_Cards with values from `GET /api/superadmin/stats`: Total Companies (active count + suspended count shown separately), Total Users (summed across every company), Total Documents (summed across every company), and Total Storage Used.
2. WHEN a Super Admin views the Overview Dashboard, THE Console SHALL display a Recent Signups list showing the last 5–10 newly created companies, each with: company name, admin email, max users, and creation date.
3. WHEN a Super Admin views the Overview Dashboard, THE Console SHALL display a Recent Errors card showing the count of `error`-level `system_logs` entries in the last 24 hours, with a link to the Logs Viewer pre-filtered accordingly.
4. IF `GET /api/superadmin/stats` returns an error, THEN THE Console SHALL display an error state on the affected Stat_Cards with a "Retry" button, without crashing the rest of the dashboard.
5. WHEN the Overview Dashboard data is loading, THE Console SHALL display loading skeleton states for all Stat_Cards and the Recent Signups list.

---

### Requirement 4: System Logs Viewer (`/logs`)

**User Story:** As a Super Admin, I want to browse and filter all platform and provisioning logs, so that I can diagnose failed company creations or instance errors.

#### Acceptance Criteria

1. WHEN a Super Admin navigates to the Logs Viewer, THE Console SHALL display a paginated table with columns: Timestamp, Level badge, Company (if the log entry relates to one), Route, Status Code, and Message (truncated).
2. THE Console SHALL support filters: Level, Date range, Company search, and Message search — all composable simultaneously.
3. WHEN a Super Admin changes any filter, THE Console SHALL debounce the input by 400ms before triggering a new request.
4. WHEN a Super Admin clicks an `error`-level log entry, THE Console SHALL expand an inline detail row showing full message, error code, meta JSON, and stack trace (development only, never in production).
5. IF no log entries match the applied filters, THEN THE Console SHALL display an empty state with a "Clear filters" button.
6. THE Console SHALL display a visible note stating log entries are purged after 30 days.

---

### Requirement 5: Company Management (`/companies`) — Provisioning and Deprovisioning

**User Story:** As a Super Admin, I want to create, view, edit the user limit of, suspend, reactivate, and permanently delete company instances, so that I can manage the platform's entire customer base end to end.

#### Acceptance Criteria

1. WHEN a Super Admin navigates to Company Management, THE Console SHALL display a paginated table of all companies with columns: Company Name, Admin Email, Subdomain, User Count (current/max), Storage Used, Status, and Created date.
2. THE Console SHALL support searching by company name or admin email, and filtering by status (`all` / `active` / `suspended`).
3. WHEN a Super Admin clicks a row, THE Console SHALL open a Detail_Drawer showing: company profile, usage statistics (users, documents, storage), and instance status (database name, container status).
4. THE Console SHALL display a "Create Company" button opening a modal form with fields: Company Name, Admin Name, Admin Email, Max Users — all required and validated via Zod (Max Users must be a positive integer) — submitting to `POST /api/superadmin/companies`.
5. WHEN `POST /api/superadmin/companies` is submitted, THE Control_Plane_API SHALL, in order: (a) create a new, uniquely-named database, (b) apply OpenSign's standard schema/structure to it, (c) create the Admin's login and Tenant/Organization/Team/profile records within it — including the submitted `MaxUsers` value on the Tenant record, (d) start a dedicated OpenSignServer instance connected to that database, (e) register a subdomain route to that instance, and (f) record the company's metadata in `Control_Plane_DB`.
6. IF any step of provisioning fails after an earlier step already succeeded (e.g. the instance fails to start after the database was created), THEN THE Control_Plane_API SHALL roll back every already-completed step for that company (drop the database, remove any partial routing) so that no partially-created, orphaned company is left in any system, and SHALL return a clear error to the Console.
7. WHILE provisioning is in progress, THE Console SHALL display a step-by-step progress indicator (e.g. "Creating database… Setting up structure… Starting instance… Registering domain…"), since this operation takes longer than a normal form save.
8. THE Console SHALL provide an "Edit Limit" action per row allowing the Super Admin to change a company's `MaxUsers` value, submitting to `PATCH /api/superadmin/companies/:id`.
9. THE Console SHALL provide a Suspend action for `active` companies that, when confirmed, stops that company's running instance (leaving its database fully intact) and disables its subdomain route, showing a "this account is suspended" page to anyone visiting it.
10. THE Console SHALL provide a Reactivate action for `suspended` companies that restarts their instance and restores their subdomain route.
11. THE Console SHALL provide a Delete (Hard) action opening a Confirm_Dialog requiring the Super Admin to type the company's exact name before the delete button becomes enabled.
12. WHEN a hard delete is confirmed, THE Control_Plane_API SHALL, in order: stop and remove that company's running instance, permanently drop its entire database, remove its subdomain route, and remove its record from `Control_Plane_DB`.
13. WHEN the companies table is loading, THE Console SHALL display skeleton rows. IF the companies list request fails, THE Console SHALL display an error state with a retry button.

---

### Requirement 6: Audit Log Viewer (`/audit`)

**User Story:** As a Super Admin, I want a read-only, tamper-proof history of every action taken through this console, so that there is always a complete record of who created, changed, suspended, or deleted a company, and when.

#### Acceptance Criteria

1. WHEN a Super Admin navigates to the Audit Log Viewer, THE Console SHALL display a read-only paginated table with columns: Timestamp, Actor (Super Admin email), Action (e.g. `company.create`, `company.suspend`, `company.delete`), Target Company, and Target ID.
2. WHEN a Super Admin clicks a row, THE Console SHALL expand an inline before/after diff view, with changed fields highlighted.
3. THE Console SHALL support filtering by Actor, Action type, and Date range.
4. THE Console SHALL NEVER display any edit or delete control on any audit log entry, anywhere.
5. IF no entries match the applied filters, THEN THE Console SHALL display an empty state with a "Clear filters" button.

---

### Requirement 7: Security — Super Admin Route Protection

**User Story:** As a platform operator, I want every console action to be protected by Super Admin role verification, so that no unauthorised party can create, modify, or destroy a company instance.

#### Acceptance Criteria

1. THE `requireSuperAdmin()` middleware SHALL return 403 `FORBIDDEN_SUPER_ADMIN_REQUIRED` for any request to `/api/superadmin/*` where the JWT's `role` is not exactly `super_admin`.
2. THE Console's route-protection middleware SHALL redirect any unauthenticated request to a protected console route to `/login`.
3. THE `role` field used for every access decision SHALL always be sourced from the signed JWT — never from any client-controlled input, request body, query parameter, or unsigned cookie value.
4. THE Console domain SHALL NOT appear anywhere inside any company's OpenSign instance (navigation, help text, or otherwise).

---

### Requirement 8: Security — Hard Delete Confirmation Guard

**User Story:** As a Super Admin, I want the hard-delete action to require typing the exact company name, so that an entire company's database and instance cannot be destroyed by accident.

#### Acceptance Criteria

1. WHEN a Super Admin clicks Delete for a company, THE Console SHALL open a Confirm_Dialog displaying the company's name prominently, a text input, and the instruction "Type [company name] to confirm deletion."
2. THE Delete button SHALL remain disabled until the input exactly matches the company's name (case-sensitive).
3. WHEN the Control_Plane_API receives a delete request, it SHALL independently verify the `confirm` field exactly matches the stored company name before executing any deletion step. IF it does not match, THE Control_Plane_API SHALL return a 422 error and perform zero deletion steps — this server-side check applies even if the frontend validation should have already prevented the request.
4. THE Confirm_Dialog SHALL visibly list everything that will be destroyed: the running instance, the entire database, all documents/files, and the subdomain.

---

### Requirement 9: User Limit Enforcement (inside each Company's own OpenSignServer)

**User Story:** As a Super Admin, I want each company strictly capped at the user limit I set for them, so that companies cannot exceed what they've been provisioned for.

#### Acceptance Criteria

1. EVERY Company's `partners_Tenant` record SHALL include a `MaxUsers` field, set at creation time and editable later only via the Super Admin Console.
2. WHEN any user-creation action is attempted within a Company's own OpenSignServer instance (sign-up, invite, or admin-added), THE instance SHALL count the existing `contracts_Users` profiles under that Tenant and SHALL reject the action with a clear "user limit reached" message if the count is already at or above `MaxUsers`.
3. THE user-limit check SHALL be enforced entirely on that Company's own backend — it SHALL NOT be possible to bypass it by calling the API directly, editing client-side state, or any means other than a Super Admin raising the limit via the Console.
4. THE Console's Company Management screen SHALL always display each company's current user count next to its limit (e.g. "7 / 10"), sourced live from that company's own instance, not from a cached or stale value.

---

### Requirement 10: Error Handling and Empty States

**User Story:** As a Super Admin, I want informative error and empty states everywhere in the console, so that I understand failures without guessing.

#### Acceptance Criteria

1. WHEN any data-fetch fails with a network error or 5xx response, THE Console SHALL display an inline error state on the affected section with a "Retry" button — not a full-page crash.
2. IF the Console detects a 401 response, THE Console SHALL clear the cookie and redirect to `/login`.
3. IF the Console detects a 403 `FORBIDDEN_SUPER_ADMIN_REQUIRED` response, THE Console SHALL display an "Access Denied" screen.
4. WHEN a mutation (create, edit, suspend, reactivate, delete) succeeds, THE Console SHALL display a success toast and invalidate the relevant cached data.
5. WHEN a mutation fails, THE Console SHALL display an error toast without closing the open modal or drawer.
6. THE Console SHALL use loading skeleton components (matching the shape of the real content) for every table, stat card, and drawer — not spinner-only states.

---

### Requirement 11: Desktop-Only UI Constraint

**User Story:** As a platform operator, I want the console to only work on desktop, so its data-heavy tables and drawers always render correctly.

#### Acceptance Criteria

1. WHEN the Console is accessed below a 1024px viewport, THE Console SHALL display a full-screen "desktop only" message and SHALL NOT render any console UI or make any API calls.
2. THE desktop-only check SHALL apply on initial render and on window resize.
3. THE Console SHALL NOT implement any mobile/responsive layout for any of its four screens.

---

## Correctness Properties

These define security- and integrity-critical invariants that must hold unconditionally, and are the highest-priority property-based test targets.

---

### Property 1: Super Admin Route Always Rejects Non-Super Admin JWT

For any JWT where `payload.role !== 'super_admin'` (including a missing role, a tampered role, or any near-match string), every request to any `/api/superadmin/*` route SHALL return 403 and SHALL NOT execute any database query, provisioning action, or audit log write.

**Validates:** Requirements 7.1, 7.3, 2.3

**Testing approach:** Generate arbitrary role values that are not the exact string `'super_admin'`. Assert 403 on every `/api/superadmin/*` endpoint for each, and assert zero side effects (no company created/deleted, no audit entry written).

---

### Property 2: Provisioning Is All-or-Nothing

For any `POST /api/superadmin/companies` request, after the operation completes (success or failure), the system SHALL be in exactly one of two states: (a) fully provisioned — database exists with correct structure, instance is running, subdomain route is active, and a `Control_Plane_DB` record exists; or (b) fully rolled back — no orphaned database, no orphaned running instance, no dangling subdomain route, and no `Control_Plane_DB` record. There SHALL be no reachable intermediate state where some but not all of these exist.

**Validates:** Requirement 5.5, 5.6

**Testing approach:** Simulate failure injection at each individual provisioning step (database creation fails, schema setup fails, instance start fails, routing registration fails). After each simulated failure, assert that no database, container, route, or Control_Plane_DB record for that attempted company remains.

---

### Property 3: Hard Delete Requires Exact Company Name Match

For any `DELETE /api/superadmin/companies/:id` request, deletion SHALL proceed if and only if the `confirm` field is an exact, case-sensitive match of the target company's stored name. Any other value SHALL cause a 422 response and zero deletion steps executed (no container stopped, no database dropped, no route removed, no record removed).

**Validates:** Requirements 8.2, 8.3

**Testing approach:** Generate name variants (case changes, whitespace, partial matches, empty string). For every non-exact variant, assert 422 and verify the company's database, container, and route are all still present afterward. For the exact match, assert full and complete cascade removal.

---

### Property 4: Audit Log Is Strictly Append-Only

For any sequence of Super Admin actions of any length and order, the total count of `audit_logs` documents SHALL be monotonically non-decreasing, and no existing audit log entry's fields SHALL ever be modified after creation.

**Validates:** Requirement 6.4, 6.1

**Testing approach:** Generate random sequences of N company actions. After each, record the audit log count and assert it never decreases. After the sequence, assert every previously-created entry's fields are unchanged from insertion time. Verify no endpoint exists that accepts PUT/PATCH/DELETE against `audit_logs`.

---

### Property 5: User Limit Can Never Be Exceeded, Even Under Concurrent Requests

For any Company with `MaxUsers = N`, no sequence of concurrent or sequential user-creation requests against that Company's own instance SHALL ever result in more than `N` `contracts_Users` profiles existing under that Tenant at any point in time.

**Validates:** Requirement 9.2, 9.3

**Testing approach:** Fire multiple simultaneous user-creation requests against a company already one slot away from its limit. Assert that exactly one succeeds and the rest are rejected with the limit-reached error — never more than `N` total users, regardless of request timing or ordering.

---

### Property 6: Company Data Isolation Survives Suspend/Delete Actions on Other Companies

For any two distinct companies A and B, suspending, reactivating, editing the limit of, or deleting Company A SHALL have no observable effect on Company B's database, running instance, subdomain route, user count, or data — verified both immediately after the action and after a subsequent read of Company B's own instance.

**Validates:** Requirement 5.9, 5.10, 5.12, and the platform's core isolation guarantee

**Testing approach:** Provision two companies. Record Company B's full state (user count, document count, instance status). Perform every destructive/state-changing action available against Company A. Re-read Company B's state and assert byte-for-byte equality with the recorded baseline.

---

## Non-Functional Requirements

### Performance

1. THE Console SHALL use a TanStack Query stale time of 60 seconds for Overview Dashboard data and 30 seconds for logs and companies data.
2. THE Console SHALL debounce all free-text filter inputs by 400ms.
3. Company provisioning SHALL complete (or definitively fail with full rollback) within a bounded time window communicated to the Super Admin via the progress indicator — it SHALL NOT hang indefinitely without feedback.

### Accessibility

1. THE Console SHALL use semantic HTML throughout (`<table>`, `<th scope>`, `<button>`, `<nav>`, `<main>`).
2. All interactive elements SHALL have minimum 44×44px touch targets and visible focus rings.
3. Status badges SHALL use both colour and text label to convey meaning.

### Browser Support

1. THE Console SHALL support the latest two versions of Chrome, Firefox, Edge, and Safari on desktop.

---

*OpenSign Super Admin Console · Requirements Document · v1.0 · July 2026*
