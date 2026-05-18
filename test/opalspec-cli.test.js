import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'bin', 'opalspec.js');

test('init installs core files and selected tool surfaces', async () => {
  const target = await makeTempRepo();

  await runCli(['init', '--target', target, '--tools', 'codex,claude', '--yes']);

  assert.equal(await exists(path.join(target, '.opal', 'runtime', 'spec-authoring-instructions.md')), true);
  assert.equal(await exists(path.join(target, '.opal', 'specs', '.gitkeep')), true);
  assert.equal(await exists(path.join(target, '.codex', 'skills', 'opalspec', 'SKILL.md')), true);
  assert.equal(await exists(path.join(target, '.claude', 'commands', 'opal', 'new.md')), true);
  assert.equal(await exists(path.join(target, '.cursor')), false);

  const agents = await fs.readFile(path.join(target, 'AGENTS.md'), 'utf8');
  assert.match(agents, /OPALSPEC-INSTRUCTIONS-START/);
  assert.match(agents, /OPALSPEC-INSTRUCTIONS-END/);
});

test('update preserves user specs and AGENTS.md content outside markers', async () => {
  const target = await makeTempRepo();

  await runCli(['init', '--target', target, '--tools', 'codex', '--yes']);
  await fs.mkdir(path.join(target, '.opal', 'specs', 'message-trash'), { recursive: true });
  await fs.writeFile(path.join(target, '.opal', 'specs', 'message-trash', 'requirements.md'), '# Keep me\n', 'utf8');
  const agentsPath = path.join(target, 'AGENTS.md');
  const agents = await fs.readFile(agentsPath, 'utf8');
  await fs.writeFile(agentsPath, `# Project custom instructions\n\n${agents}\n\nCustom tail.\n`, 'utf8');

  await runCli(['update', '--target', target]);

  assert.equal(await fs.readFile(path.join(target, '.opal', 'specs', 'message-trash', 'requirements.md'), 'utf8'), '# Keep me\n');
  const updatedAgents = await fs.readFile(agentsPath, 'utf8');
  assert.match(updatedAgents, /# Project custom instructions/);
  assert.match(updatedAgents, /Custom tail\./);
});

test('add-tool installs an additional surface', async () => {
  const target = await makeTempRepo();

  await runCli(['init', '--target', target, '--tools', 'codex', '--yes']);
  await runCli(['add-tool', 'cursor', '--target', target]);

  assert.equal(await exists(path.join(target, '.cursor', 'commands', 'opal-new.md')), true);
});

test('doctor succeeds for a healthy install', async () => {
  const target = await makeTempRepo();

  await runCli(['init', '--target', target, '--tools', 'codex', '--yes']);
  const result = await runCli(['doctor', '--target', target]);

  assert.match(result.stdout, /install looks healthy/);
});

test('install-codex-prompts writes prompts to codex home', async () => {
  const codexHome = await fs.mkdtemp(path.join(os.tmpdir(), 'opalspec-codex-'));

  await runCli(['install-codex-prompts', '--codex-home', codexHome]);

  assert.equal(await exists(path.join(codexHome, 'prompts', 'opal-new.md')), true);
  assert.equal(await exists(path.join(codexHome, 'prompts', 'opal-build.md')), true);
});

async function makeTempRepo() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'opalspec-cli-'));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [cliPath, ...args], { cwd: repoRoot }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
