// Starts/stops a dedicated OpenSign frontend (Vite dev server) per company,
// each pointed at that company's own backend port - so the Super Admin (or
// anyone testing) can click straight into a real login page for any company
// instead of only ever seeing the raw backend API response.
//
// Testing mode only: each company gets its own Vite dev server process on
// its own port. A real deployment would use one shared frontend build with
// the reverse proxy routing each subdomain to the right backend instead.

import { spawn, exec } from 'child_process';
import { writeFileSync } from 'fs';
import { openSignFrontendSourcePath } from '../Utils.js';

const runningFrontends = new Map(); // slug -> child process PID

export async function startCompanyFrontend({ slug, backendPort, frontendPort }) {
  const envContent = [
    `PUBLIC_URL=http://localhost:${frontendPort}`,
    'GENERATE_SOURCEMAP=false',
    `REACT_APP_SERVERURL=http://localhost:${backendPort}/app`,
    'REACT_APP_APPID=opensign',
    '',
  ].join('\n');
  writeFileSync(`${openSignFrontendSourcePath}/.env.${slug}`, envContent);

  const child = spawn(
    'npx',
    ['vite', '--mode', slug, '--port', String(frontendPort), '--strictPort'],
    {
      cwd: openSignFrontendSourcePath,
      shell: true,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }
  );
  child.unref();
  runningFrontends.set(slug, child.pid);

  return `http://localhost:${frontendPort}`;
}

export function stopCompanyFrontend(slug) {
  const pid = runningFrontends.get(slug);
  if (!pid) return;
  // /T kills the whole process tree (npx spawns a child node process for
  // vite) - killing just the parent PID would leave the real server running.
  exec(`taskkill /PID ${pid} /T /F`, () => {});
  runningFrontends.delete(slug);
}
