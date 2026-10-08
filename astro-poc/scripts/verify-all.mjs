import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deploymentEnvironment } from './deployment.mjs';

const environment = deploymentEnvironment(process.argv[2]);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scripts = [
  'verify-build.mjs', 'verify-indexability.mjs', 'verify-editorial-routes.mjs',
  'verify-dynamax-crystals-guide.mjs', 'verify-tools-phase10b.mjs',
  'verify-team-coverage.mjs', 'verify-tcg-challenge.mjs',
  'verify-ev-training-routes.mjs', 'verify-dppt-feebas-calculator.mjs',
  'verify-rse-feebas-calculator.mjs', 'test-move-learner-tools.mjs',
  'verify-moves.mjs', 'audit-abilities.mjs', 'verify-abilities.mjs',
  'audit-form-semantics.mjs', 'audit-catalog-readiness.mjs'
];
for (const script of scripts) execFileSync(process.execPath, [join('scripts', script)], {
  cwd: root,
  env: { ...process.env, POKELORE_DEPLOY_ENV: environment },
  stdio: 'inherit'
});

