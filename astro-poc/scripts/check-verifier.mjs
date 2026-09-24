// Deliberately corrupt isolated copies to prove the output verifier fails closed.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const parent = `evidence/verifier-${Date.now()}`;
mkdirSync(parent, { recursive: true });
const cases = {
  canonical: html => html.replace('rel="canonical"', 'rel="wrong"'),
  analysis: html => html.replace(/(<div[^>]*id="competitive"[^>]*>[\s\S]*?<p>)[\s\S]*?(<\/p>)/, '$1Missing$2'),
  duplicateH1: html => html.replace('</h1>', '</h1><h1>Duplicate</h1>'),
  noindex: html => html.replace('index,follow,max-image-preview:large', 'noindex,follow')
};
for (const [name, corrupt] of Object.entries(cases)) {
  const output = join(parent, name);
  cpSync('dist', output, { recursive: true });
  const page = join(output, 'pokemon/kakuna.html');
  const original = readFileSync(page, 'utf8');
  const changed = corrupt(original);
  assert.notEqual(changed, original, `${name}: mutation applied`);
  writeFileSync(page, changed);
  const check = spawnSync(process.execPath, ['scripts/verify-build.mjs', output], { encoding: 'utf8' });
  assert.equal(check.status, 1, `${name}: verifier must reject corrupted output\n${check.stdout}\n${check.stderr}`);
  console.log(`PASS: verifier rejected ${name} regression`);
}

// A surviving extensionless copy must fail even if its content is correct.
const aliasOutput = join(parent, 'html-alias');
cpSync('dist', aliasOutput, { recursive: true });
cpSync(join(aliasOutput, 'pokemon/kakuna.html'), join(aliasOutput, 'pokemon/kakuna'));
const aliasCheck = spawnSync(process.execPath, ['scripts/verify-build.mjs', aliasOutput], { encoding: 'utf8' });
assert.equal(aliasCheck.status, 1, `verifier must reject extensionless copy\n${aliasCheck.stdout}\n${aliasCheck.stderr}`);
console.log('PASS: verifier rejected extensionless page copy');
