// Wraps the Docker CLI to start/stop/remove a company's dedicated
// OpenSignServer container. Testing mode: uses the official published
// image and plain localhost ports (no reverse-proxy/subdomain routing yet -
// see proxyManager.js for where that would plug in for a real deployment).
//
// IMPORTANT: `docker build`-ing our own image on this machine silently
// corrupts .js files (a real, unresolved Windows/Docker bug - see today's
// debugging). So instead of baking our code into an image, we bind-mount
// the real local apps/OpenSignServer source directly into the container at
// runtime, using the public image only for its OS/Node/LibreOffice/
// node_modules. An anonymous volume protects the container's own Linux-
// native node_modules from being overwritten by our Windows-installed one
// (which would break native modules like `sharp`).

import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  openSignServerImage,
  controlPlaneMongoHostForContainers,
  controlPlaneMongoPort,
  companyMasterKey,
  companyAppId,
  openSignServerSourcePath,
} from '../Utils.js';

const execFileAsync = promisify(execFile);

async function runDocker(args) {
  try {
    const { stdout } = await execFileAsync('docker', args);
    return stdout.trim();
  } catch (err) {
    throw new Error(`docker ${args.join(' ')} failed: ${err.stderr || err.message}`);
  }
}

// Starts a brand-new container for a company, connected to their own
// database (same MongoDB server as the control plane, different db name).
export async function startCompanyContainer({ containerName, hostPort, databaseName }) {
  const mongoUri = `mongodb://${controlPlaneMongoHostForContainers}:${controlPlaneMongoPort}/${databaseName}`;
  const serverUrl = `http://localhost:${hostPort}/app`;

  const containerId = await runDocker([
    'run', '-d',
    '--name', containerName,
    '-p', `${hostPort}:8080`,
    '-v', `${openSignServerSourcePath}:/usr/src/app`,
    '-v', '/usr/src/app/node_modules',
    '-w', '/usr/src/app',
    '-e', `MONGODB_URI=${mongoUri}`,
    '-e', `MASTER_KEY=${companyMasterKey}`,
    '-e', `APP_ID=${companyAppId}`,
    '-e', `SERVER_URL=${serverUrl}`,
    '-e', 'USE_LOCAL=true',
    openSignServerImage,
  ]);
  return containerId;
}

export async function stopCompanyContainer(containerName) {
  await runDocker(['stop', containerName]);
}

export async function restartCompanyContainer(containerName) {
  await runDocker(['start', containerName]);
}

export async function removeCompanyContainer(containerName) {
  try {
    await runDocker(['rm', '-f', containerName]);
  } catch (err) {
    // Already gone is fine - deprovisioning should still proceed.
    console.log(`removeCompanyContainer: ${err.message}`);
  }
}

export async function containerExists(containerName) {
  try {
    await runDocker(['inspect', containerName]);
    return true;
  } catch {
    return false;
  }
}
