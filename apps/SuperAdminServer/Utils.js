import dotenv from 'dotenv';
import crypto from 'node:crypto';
dotenv.config({ quiet: true });

export const appId = process.env.APP_ID || 'superadmin';
export const masterKey = process.env.MASTER_KEY;
export const serverUrl = process.env.SERVER_URL || 'http://localhost:9000/app';
export const port = process.env.PORT || 9000;

export const controlPlaneMongoHostForContainers =
  process.env.CONTROLPLANE_MONGO_HOST_FOR_CONTAINERS || 'host.docker.internal';
export const controlPlaneMongoPort = process.env.CONTROLPLANE_MONGO_PORT || 27030;

export const openSignServerImage = process.env.OPENSIGN_SERVER_IMAGE || 'opensign/opensignserver:main';
export const companyPortRangeStart = parseInt(process.env.COMPANY_PORT_RANGE_START || '9100', 10);
export const companyMasterKey = process.env.COMPANY_MASTER_KEY;
export const companyAppId = process.env.COMPANY_APP_ID || 'opensign';

// Real local source, bind-mounted into every company container instead of
// baking it into a built image (see dockerManager.js for why).
export const openSignServerSourcePath =
  process.env.OPENSIGN_SERVER_SOURCE_PATH ||
  'C:/Users/xeon5/Downloads/OpenSign-staging (1)/OpenSign-staging/apps/OpenSignServer';

// The real OpenSign frontend - one Vite dev server gets started per company,
// each pointed at that company's own backend port, so the Super Admin can
// jump straight into any company's real login page instead of only ever
// seeing the raw backend API.
export const openSignFrontendSourcePath =
  process.env.OPENSIGN_FRONTEND_SOURCE_PATH ||
  'C:/Users/xeon5/Downloads/OpenSign-staging (1)/OpenSign-staging/apps/OpenSign';
export const companyFrontendPortRangeStart = parseInt(
  process.env.COMPANY_FRONTEND_PORT_RANGE_START || '3100',
  10
);

// The shared OpenSign container (docker/opensign) - one frontend+backend
// for every company, each mounted at /app/<slug> inside it, instead of a
// separate container per company. openSignInternalUrl is how *this*
// server reaches it (its Docker network container name in production,
// e.g. http://opensign:80); openSignPublicOrigin is what real users see
// in their browser (e.g. https://sign.toowix.com), used only to build the
// login URL shown to the Super Admin after provisioning.
export const openSignInternalUrl = process.env.OPENSIGN_INTERNAL_URL || 'http://localhost:3001';
export const openSignPublicOrigin = process.env.OPENSIGN_PUBLIC_ORIGIN || openSignInternalUrl;
// Must match INTERNAL_ADMIN_SECRET on the OpenSign container exactly -
// required to call its POST /admin/mount-company endpoint.
export const openSignInternalAdminSecret = process.env.OPENSIGN_INTERNAL_ADMIN_SECRET;

// Turns a company name like "Jayesh Hospital Pvt Ltd" into a safe MongoDB
// database name and a safe subdomain slug - lowercase, letters/numbers only.
export function slugifyCompanyName(companyName) {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function generateObjectId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Generates a real, secure temporary password for a new company's admin -
// uses crypto.randomInt (not Math.random, which isn't safe for secrets).
// Guaranteed to include a letter, a digit, and a symbol so it passes typical
// password-complexity rules on first login.
export function generateSecureTempPassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  // Deliberately excludes URL-reserved/ambiguous characters (& # % + = ? /
  // space etc.) - Parse's login endpoint passes credentials in a query
  // string under the hood, so a password containing one of those can get
  // truncated or misparsed, making a perfectly "correct" password fail to
  // log in. Every symbol here is always safe in a URL, JSON body, and shell.
  const symbols = '!@*-_.';
  const all = letters + digits + symbols;

  const pick = (set) => set[crypto.randomInt(set.length)];
  const required = [pick(letters), pick(letters), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 8 }, () => pick(all));

  return [...required, ...rest].sort(() => crypto.randomInt(3) - 1).join('');
}
