import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const STAGING = 'staging';
export const PRODUCTION = 'production';
export const DEFAULT_GA_MEASUREMENT_ID = 'G-K4YZXKJHVJ';

export function deploymentEnvironment(value = process.env.POKELORE_DEPLOY_ENV) {
  const environment = value ?? STAGING;
  if (![STAGING, PRODUCTION].includes(environment)) {
    throw new Error(`POKELORE_DEPLOY_ENV must be "${STAGING}" or "${PRODUCTION}", received "${environment}".`);
  }
  return environment;
}

export function deploymentHeaders(environment = deploymentEnvironment()) {
  return environment === STAGING
    ? '# STAGING ONLY: protect every staging response from indexing.\n/*\n  X-Robots-Tag: noindex\n'
    : '# Production intentionally has no blanket X-Robots-Tag directive.\n';
}

export function writeDeploymentHeaders(outputDirectory, environment = deploymentEnvironment()) {
  writeFileSync(join(outputDirectory, '_headers'), deploymentHeaders(environment));
}

