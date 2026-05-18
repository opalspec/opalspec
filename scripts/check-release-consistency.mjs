import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const failures = [];

async function read(relativePath) {
  try {
    return await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    failures.push(`Missing file: ${relativePath}`);
    return '';
  }
}

function assertContains(relativePath, text, needles, label) {
  for (const needle of needles) {
    if (!text.includes(needle)) {
      failures.push(`${label} missing '${needle}' in ${relativePath}`);
    }
  }
}

function assertVersionText(relativePath, text, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`version:\\s*"${escaped}"`).test(text)) {
    failures.push(`Version mismatch in ${relativePath}; expected metadata version ${version}`);
  }
}

const payloadVersion = (await read('payload/.opal/VERSION')).trim();
const pkg = parseJson(await read('package.json'));
if (pkg.version !== payloadVersion) {
  failures.push(`package.json version ${pkg.version} does not match payload/.opal/VERSION ${payloadVersion}`);
}

for (const relativePath of [
  'payload/.codex/skills/opalspec/SKILL.md',
  'payload/.claude/skills/opalspec/SKILL.md',
  'payload/plugins/opalspec/skills/opalspec/SKILL.md'
]) {
  assertVersionText(relativePath, await read(relativePath), payloadVersion);
}

const plugin = parseJson(await read('payload/plugins/opalspec/.codex-plugin/plugin.json'));
if (plugin.version !== payloadVersion) {
  failures.push(`Plugin metadata version ${plugin.version} does not match ${payloadVersion}`);
}

const manifest = await read('payload/.opal/runtime/command-manifest.md');
assertContains('payload/.opal/runtime/command-manifest.md', manifest, [
  '/opal:preflight',
  'opal-preflight',
  'opal/preflight',
  'opal-preflight.prompt.md',
  'preflight-instructions.md'
], 'Command manifest');

const cli = await read('src/opalspec-cli.js');
assertContains('src/opalspec-cli.js', cli, [
  'opal-preflight.md',
  'opal-build.md',
  'opal-document.md',
  'OPALSPEC-INSTRUCTIONS-START'
], 'npm CLI');

if (failures.length > 0) {
  console.error('OpalSpec release consistency check failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`OpalSpec release consistency check passed for version ${payloadVersion}.`);

function parseJson(text) {
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}
