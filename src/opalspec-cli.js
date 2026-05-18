import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const payloadRoot = path.join(packageRoot, 'payload');
const allTools = ['codex', 'claude', 'cursor', 'gemini', 'github-copilot', 'plugin'];
const opalBlockStart = '<!-- OPALSPEC-INSTRUCTIONS-START -->';
const opalBlockEnd = '<!-- OPALSPEC-INSTRUCTIONS-END -->';

export async function main(argv = process.argv) {
  const [, , command = 'help', ...args] = argv;

  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  const options = parseOptions(args);

  switch (command) {
    case 'init':
      await installCommand({ ...options, update: false });
      break;
    case 'update':
      await installCommand({ ...options, update: true, force: true });
      break;
    case 'add-tool':
      await addToolCommand(options);
      break;
    case 'install-codex-prompts':
      await installCodexPromptsCommand(options);
      break;
    case 'doctor':
      await doctorCommand(options);
      break;
    case 'version':
    case '--version':
    case '-v':
      await versionCommand(options);
      break;
    default:
      throw new Error(`Unknown command: ${command}\nRun "opalspec help" for usage.`);
  }
}

function printHelp() {
  console.log(`OpalSpec CLI

Usage:
  opalspec init [--target .] --tools codex,claude [--yes]
  opalspec update [--target .]
  opalspec add-tool <tool[,tool...]> [--target .]
  opalspec install-codex-prompts [--codex-home <path>]
  opalspec doctor [--target .]
  opalspec version [--target .]

Options:
  --target <path>             Target repository. Defaults to current directory.
  --tools <list|all|none>     Tool surfaces: codex, claude, cursor, gemini, github-copilot, plugin.
  --install-codex-prompts     Copy OpalSpec Codex prompts into Codex home.
  --codex-home <path>         Override CODEX_HOME for Codex prompt install.
  --force                     Overwrite OpalSpec-owned files.
  --dry-run                   Print planned writes without changing files.
  --yes                       Non-interactive mode.
`);
}

function parseOptions(args) {
  const options = {
    positional: [],
    target: '.',
    tools: undefined,
    installCodexPrompts: false,
    codexHome: process.env.CODEX_HOME || '',
    force: false,
    dryRun: false,
    yes: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--target' || arg === '-t') {
      options.target = requireValue(args, ++index, arg);
    } else if (arg.startsWith('--target=')) {
      options.target = arg.slice('--target='.length);
    } else if (arg === '--tools' || arg === '--tool') {
      options.tools = parseTools(requireValue(args, ++index, arg));
    } else if (arg.startsWith('--tools=')) {
      options.tools = parseTools(arg.slice('--tools='.length));
    } else if (arg.startsWith('--tool=')) {
      options.tools = parseTools(arg.slice('--tool='.length));
    } else if (arg === '--install-codex-prompts') {
      options.installCodexPrompts = true;
    } else if (arg === '--codex-home') {
      options.codexHome = requireValue(args, ++index, arg);
    } else if (arg.startsWith('--codex-home=')) {
      options.codexHome = arg.slice('--codex-home='.length);
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--dry-run' || arg === '--what-if') {
      options.dryRun = true;
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.positional.push(arg);
    }
  }

  return options;
}

function requireValue(args, index, optionName) {
  const value = args[index];
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${optionName}`);
  }
  return value;
}

function parseTools(value) {
  if (Array.isArray(value)) return normalizeTools(value);
  const normalized = value.trim().toLowerCase();
  if (normalized === 'all') return [...allTools];
  if (normalized === 'none') return [];
  return normalizeTools(value.split(',').map((item) => item.trim()).filter(Boolean));
}

function normalizeTools(tools) {
  const unique = [...new Set(tools)];
  const invalid = unique.filter((tool) => !allTools.includes(tool));
  if (invalid.length > 0) {
    throw new Error(`Unsupported tool value: ${invalid.join(', ')}\nSupported tools: ${allTools.join(', ')}`);
  }
  return unique;
}

async function installCommand(rawOptions) {
  const options = await prepareInstallOptions(rawOptions);
  const payloadVersion = await getPayloadVersion();
  const targetRoot = path.resolve(process.cwd(), options.target);

  await ensurePayloadExists();

  if (!(await pathExists(targetRoot))) {
    await mkdir(targetRoot, options, `Create target repository directory: ${targetRoot}`);
  }

  const existingVersion = await getInstalledVersion(targetRoot);

  if (existingVersion) {
    if (existingVersion === payloadVersion) {
      console.log(`OpalSpec ${payloadVersion} already installed at ${targetRoot}.`);
    } else {
      console.log(`Updating OpalSpec in ${targetRoot} from ${existingVersion} to ${payloadVersion}.`);
    }
  } else {
    console.log(`Installing OpalSpec ${payloadVersion} to ${targetRoot}.`);
  }

  const effectiveTools = await resolveEffectiveTools(targetRoot, options);

  await removeStaleBuildRenamedCommands(targetRoot, effectiveTools, options);
  await copyPayloadItem('.opal', '.opal', targetRoot, options);
  await ensureAgentsBlock(targetRoot, options);

  if (effectiveTools.includes('codex')) {
    await copyPayloadItem('.codex', '.codex', targetRoot, options);
  }
  if (effectiveTools.includes('claude')) {
    await copyPayloadItem(path.join('.claude', 'commands', 'opal'), path.join('.claude', 'commands', 'opal'), targetRoot, options);
    await copyPayloadItem(path.join('.claude', 'skills', 'opalspec'), path.join('.claude', 'skills', 'opalspec'), targetRoot, options);
  }
  if (effectiveTools.includes('cursor')) {
    await copyPayloadItem('.cursor', '.cursor', targetRoot, options);
  }
  if (effectiveTools.includes('gemini')) {
    await copyPayloadItem('.gemini', '.gemini', targetRoot, options);
  }
  if (effectiveTools.includes('github-copilot')) {
    await copyPayloadItem(path.join('.github', 'prompts'), path.join('.github', 'prompts'), targetRoot, options);
  }
  if (effectiveTools.includes('plugin')) {
    await copyPayloadItem(path.join('plugins', 'opalspec'), path.join('plugins', 'opalspec'), targetRoot, options);
    await copyPayloadItem('.agents', '.agents', targetRoot, options);
  }

  if (options.installCodexPrompts) {
    await installCodexPrompts(options);
  }

  await writeFile(path.join(targetRoot, '.opal', 'VERSION'), payloadVersion, options, `Write OpalSpec VERSION ${payloadVersion}`);

  if (existingVersion && existingVersion !== payloadVersion) {
    console.log(`OpalSpec updated to ${payloadVersion} at ${targetRoot} (from ${existingVersion}).`);
  } else {
    console.log(`OpalSpec ${payloadVersion} install complete for ${targetRoot}.`);
  }
  console.log('Next: restart/reload your AI IDE if command or skill discovery does not update automatically.');
}

async function prepareInstallOptions(options) {
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!options.update && options.tools === undefined && !options.yes) {
    options.tools = await promptForTools();
  }

  if (!options.update && options.tools === undefined) {
    throw new Error('You must specify --tools <name> unless running update. Use --tools none to install only core OpalSpec files.');
  }

  if (!options.update && options.tools.length === 0) {
    console.log('Installing core OpalSpec files only; no AI tool surfaces selected.');
  }

  return options;
}

async function promptForTools() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`Which tools should OpalSpec install? (${allTools.join(', ')}, all, none): `);
    if (!answer.trim()) {
      throw new Error('No tools selected. Re-run with --tools <name> or --tools none.');
    }
    return parseTools(answer);
  } finally {
    rl.close();
  }
}

async function resolveEffectiveTools(targetRoot, options) {
  const requestedTools = options.tools ?? [];
  if (options.update) {
    const installedTools = await getInstalledOpalSpecTools(targetRoot);
    if (installedTools.length > 0) {
      if (requestedTools.length > 0) {
        console.log('Ignoring --tools during update; installed tool surfaces are refreshed automatically.');
      }
      console.log(`Update mode detected installed OpalSpec tool surfaces: ${installedTools.join(', ')}`);
      return installedTools;
    }
    if (options.tools !== undefined) {
      console.warn('No installed OpalSpec tool surfaces were detected; falling back to supplied --tools values.');
      return requestedTools;
    }
    throw new Error('No installed OpalSpec tool surfaces were detected. For a first install, run "opalspec init --tools <name>". For a partial update, pass --tools <name>.');
  }

  return requestedTools;
}

async function addToolCommand(options) {
  const rawTools = options.tools ?? parseTools(options.positional.join(','));
  if (!rawTools || rawTools.length === 0) {
    throw new Error('Usage: opalspec add-tool <tool[,tool...]>');
  }
  await installCommand({ ...options, tools: rawTools, update: false, force: true });
}

async function installCodexPromptsCommand(options) {
  await ensurePayloadExists();
  await installCodexPrompts(options);
}

async function doctorCommand(options) {
  const targetRoot = path.resolve(process.cwd(), options.target);
  const failures = [];
  const warnings = [];

  if (!(await pathExists(targetRoot))) {
    failures.push(`Target repository does not exist: ${targetRoot}`);
  }

  const installedVersion = await getInstalledVersion(targetRoot);
  if (!installedVersion) {
    failures.push('Missing .opal/VERSION.');
  }

  if (!(await pathExists(path.join(targetRoot, '.opal', 'runtime')))) {
    failures.push('Missing .opal/runtime/.');
  }

  const agentsPath = path.join(targetRoot, 'AGENTS.md');
  if (!(await pathExists(agentsPath))) {
    failures.push('Missing AGENTS.md.');
  } else {
    const agents = await fs.readFile(agentsPath, 'utf8');
    if (!agents.includes(opalBlockStart) || !agents.includes(opalBlockEnd)) {
      failures.push('AGENTS.md is missing OpalSpec markers.');
    }
  }

  const installedTools = await getInstalledOpalSpecTools(targetRoot);
  if (installedTools.length === 0) {
    warnings.push('No OpalSpec tool surfaces detected. This is fine only if the repo was intentionally installed with --tools none.');
  }

  if (failures.length > 0) {
    console.log('OpalSpec doctor found issues:');
    for (const failure of failures) console.log(` - ${failure}`);
    for (const warning of warnings) console.log(` - Warning: ${warning}`);
    process.exitCode = 1;
    return;
  }

  console.log(`OpalSpec install looks healthy at ${targetRoot}.`);
  console.log(`Installed version: ${installedVersion}`);
  console.log(`Detected tools: ${installedTools.length > 0 ? installedTools.join(', ') : 'none'}`);
  for (const warning of warnings) console.log(`Warning: ${warning}`);
}

async function versionCommand(options) {
  const pkg = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  const targetRoot = path.resolve(process.cwd(), options.target);
  const installedVersion = await getInstalledVersion(targetRoot);
  console.log(`OpalSpec CLI: ${pkg.version}`);
  if (installedVersion) {
    console.log(`Installed repo: ${installedVersion}`);
  }
}

async function getInstalledOpalSpecTools(root) {
  const installed = [];

  if (await pathExists(path.join(root, '.codex', 'skills', 'opalspec'))) installed.push('codex');
  if (
    (await pathExists(path.join(root, '.claude', 'commands', 'opal'))) ||
    (await pathExists(path.join(root, '.claude', 'skills', 'opalspec')))
  ) installed.push('claude');
  if (
    (await pathExists(path.join(root, '.cursor', 'commands', 'opal-new.md'))) ||
    (await pathExists(path.join(root, '.cursor', 'commands', 'opal-design.md')))
  ) installed.push('cursor');
  if (await pathExists(path.join(root, '.gemini', 'commands', 'opal'))) installed.push('gemini');
  if (
    (await pathExists(path.join(root, '.github', 'prompts', 'opal-new.prompt.md'))) ||
    (await pathExists(path.join(root, '.github', 'prompts', 'opal-design.prompt.md')))
  ) installed.push('github-copilot');

  const marketplacePath = path.join(root, '.agents', 'plugins', 'marketplace.json');
  let hasMarketplaceEntry = false;
  if (await pathExists(marketplacePath)) {
    const raw = await fs.readFile(marketplacePath, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      hasMarketplaceEntry = Array.isArray(parsed.plugins) && parsed.plugins.some((plugin) => plugin.name === 'opalspec');
    } catch {
      hasMarketplaceEntry = raw.includes('"name"') && raw.includes('"opalspec"');
    }
  }

  if ((await pathExists(path.join(root, 'plugins', 'opalspec'))) || hasMarketplaceEntry) installed.push('plugin');
  return [...new Set(installed)];
}

async function removeStaleBuildRenamedCommands(targetRoot, effectiveTools, options) {
  const stalePaths = [
    path.join('.opal', 'runtime', 'prompts', 'implement.prompt.md'),
    path.join('.opal', 'runtime', 'codex-prompts', 'opal-implement.md')
  ];

  if (effectiveTools.includes('claude')) stalePaths.push(path.join('.claude', 'commands', 'opal', 'implement.md'));
  if (effectiveTools.includes('cursor')) stalePaths.push(path.join('.cursor', 'commands', 'opal-implement.md'));
  if (effectiveTools.includes('gemini')) stalePaths.push(path.join('.gemini', 'commands', 'opal', 'implement.toml'));
  if (effectiveTools.includes('github-copilot')) stalePaths.push(path.join('.github', 'prompts', 'opal-implement.prompt.md'));

  for (const relativePath of stalePaths) {
    await removeIfExists(path.join(targetRoot, relativePath), options, `Remove stale /opal:implement wrapper: ${relativePath}`);
  }

  if (options.installCodexPrompts) {
    await removeIfExists(path.join(resolveCodexHome(options), 'prompts', 'opal-implement.md'), options, 'Remove stale Codex prompt opal-implement.md');
  }
}

async function copyPayloadItem(relativeSource, relativeDestination, targetRoot, options) {
  const source = path.join(payloadRoot, relativeSource);
  if (!(await pathExists(source))) {
    console.warn(`Skipping missing payload path: ${relativeSource}`);
    return;
  }
  const destination = path.join(targetRoot, relativeDestination);
  await copyPath(source, destination, options, `Install ${relativeSource} -> ${relativeDestination}`);
}

async function ensureAgentsBlock(targetRoot, options) {
  const source = path.join(payloadRoot, 'AGENTS.opal.md');
  if (!(await pathExists(source))) return;

  const target = path.join(targetRoot, 'AGENTS.md');
  const body = (await fs.readFile(source, 'utf8')).trimEnd();
  const block = `${opalBlockStart}\n${body}\n${opalBlockEnd}`;

  if (!(await pathExists(target))) {
    await writeFile(target, `${block}\n`, options, 'Create AGENTS.md with OpalSpec instructions');
    return;
  }

  const existing = await fs.readFile(target, 'utf8');
  if (existing.includes(opalBlockStart) && existing.includes(opalBlockEnd)) {
    const updated = replaceMarkedBlock(existing, opalBlockStart, opalBlockEnd, block);
    if (updated !== existing) {
      await writeFile(target, updated, options, 'Refresh OpalSpec AGENTS.md instructions block');
      console.log('AGENTS.md OpalSpec block refreshed.');
    } else {
      console.log('AGENTS.md OpalSpec block already up to date.');
    }
    return;
  }

  if (existing.includes(opalBlockStart) || existing.includes(opalBlockEnd)) {
    throw new Error('AGENTS.md contains only one OpalSpec marker. Repair the marker block before continuing.');
  }

  await writeFile(target, `${existing.trimEnd()}\n\n${block}\n`, options, 'Append OpalSpec AGENTS.md instructions');
}

async function installCodexPrompts(options) {
  const source = path.join(payloadRoot, '.opal', 'runtime', 'codex-prompts');
  const target = path.join(resolveCodexHome(options), 'prompts');
  if (!(await pathExists(source))) {
    console.warn(`Missing Codex prompt source: ${source}`);
    return;
  }

  await mkdir(target, options, 'Create Codex prompts directory');
  for (const file of ['opal-new.md', 'opal-design.md', 'opal-preflight.md', 'opal-playback.md', 'opal-tasks.md', 'opal-build.md', 'opal-document.md']) {
    await copyPath(path.join(source, file), path.join(target, file), { ...options, force: true }, `Install Codex prompt ${file}`);
  }
  console.log(`Installed OpalSpec Codex prompts to ${target}.`);
}

function resolveCodexHome(options) {
  return options.codexHome && options.codexHome.trim() ? path.resolve(options.codexHome) : path.join(os.homedir(), '.codex');
}

function replaceMarkedBlock(text, start, end, replacement) {
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return text.replace(pattern, replacement);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getPayloadVersion() {
  const version = await readTrimmed(path.join(payloadRoot, '.opal', 'VERSION'));
  return version || 'unknown';
}

async function getInstalledVersion(targetRoot) {
  return readTrimmed(path.join(targetRoot, '.opal', 'VERSION'));
}

async function ensurePayloadExists() {
  if (!(await pathExists(payloadRoot))) {
    throw new Error(`Missing payload directory: ${payloadRoot}`);
  }
}

async function readTrimmed(filePath) {
  try {
    return (await fs.readFile(filePath, 'utf8')).trim() || null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function mkdir(dirPath, options, action) {
  if (options.dryRun) {
    console.log(`[dry-run] ${action}`);
    return;
  }
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeFile(filePath, content, options, action) {
  if (options.dryRun) {
    console.log(`[dry-run] ${action}: ${filePath}`);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

async function copyPath(source, destination, options, action) {
  if (options.dryRun) {
    console.log(`[dry-run] ${action}`);
    return;
  }
  const sourceStat = await fs.stat(source);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (sourceStat.isDirectory()) {
    if ((await pathExists(destination)) && !options.force) {
      await fs.cp(source, destination, { recursive: true, force: false, errorOnExist: false });
    } else {
      await fs.cp(source, destination, { recursive: true, force: options.force });
    }
  } else {
    await fs.copyFile(source, destination);
  }
}

async function removeIfExists(target, options, action) {
  if (!(await pathExists(target))) return;
  if (options.dryRun) {
    console.log(`[dry-run] ${action}: ${target}`);
    return;
  }
  await fs.rm(target, { recursive: true, force: true });
  console.log(`  ${action}`);
}

// fs.cp currently skips dotfiles only when globbing is involved. We never glob here, but
// keep this import alive in packaged environments that tree-shake unused built-ins badly.
void fsSync;
