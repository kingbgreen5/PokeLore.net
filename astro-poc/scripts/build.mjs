import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEFAULT_GA_MEASUREMENT_ID, PRODUCTION, deploymentEnvironment } from './deployment.mjs';

const environment = deploymentEnvironment(process.argv[2]);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const run = (command, args) => execFileSync(command, args, {
  cwd: root,
  env: {
    ...process.env,
    POKELORE_DEPLOY_ENV: environment,
    // Analytics is deliberately absent from staging to avoid test traffic.
    PUBLIC_GA_MEASUREMENT_ID: environment === PRODUCTION ? DEFAULT_GA_MEASUREMENT_ID : ''
  },
  stdio: 'inherit'
});

run(process.execPath, ['scripts/generate-editorial-static-fragments.mjs']);
run(process.execPath, ['scripts/generate-redirects.mjs']);
run(process.execPath, [join('node_modules', 'astro', 'bin', 'astro.mjs'), 'build']);
run(process.execPath, ['scripts/verify-all.mjs', environment]);

