// TESTING MODE STUB. In a real deployment, this module would update Caddy's
// routing config so that <subdomain>.yourbrand.com forwards to the right
// company's container port (see design.md's "Provisioning Flow" step 7).
//
// For local testing, companies are reached directly via their assigned
// localhost port (e.g. http://localhost:9101), so there is no real routing
// rule to add/remove yet - these functions are intentionally no-ops that
// just log what a real deployment would have done, so createCompany.js and
// deleteCompany.js can call them unconditionally either way.

export async function registerRoute({ subdomain, port }) {
  console.log(`[proxyManager - testing mode, no-op] would route ${subdomain}.yourbrand.com -> localhost:${port}`);
}

export async function removeRoute({ subdomain }) {
  console.log(`[proxyManager - testing mode, no-op] would remove routing for ${subdomain}.yourbrand.com`);
}

export async function pauseRoute({ subdomain }) {
  console.log(`[proxyManager - testing mode, no-op] would show suspended page for ${subdomain}.yourbrand.com`);
}
