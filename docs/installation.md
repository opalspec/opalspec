# Installation

OpalSpec installs a small set of workflow files into the repository where you want to use it. There is no daemon, hosted service, API key, or background process. The installer copies markdown prompts, skills, command files, runtime instructions, and placeholders into your repo.

## Requirements

- Node.js 20.19.0 or higher
- npm, pnpm, yarn, or bun
- A target repository where you want to install the workflow
- At least one supported AI tool selection, unless you intentionally install core files only

The recommended installer is the cross-platform `opalspec` npm CLI. Source-checkout wrappers (`install.sh` for macOS / Linux, `install.ps1` for Windows) are available as fallbacks.

## npm Install

Install the CLI globally:

```bash
npm install -g @opalspec/opalspec@latest
```

Then initialize OpalSpec in a project:

```bash
cd your-project
opalspec init --tools codex
```

Install multiple tool surfaces:

```bash
opalspec init --tools codex,claude,cursor
```

Run without a global install:

```bash
npx @opalspec/opalspec@latest init --tools codex
```

Supported `--tools` values:

```text
codex
claude
cursor
gemini
github-copilot
plugin
```

You can also use:

```bash
opalspec init --tools all
opalspec init --tools none
```

`--tools none` installs only `.opal/` runtime files and the `AGENTS.md` block.

## Preview Before Writing

Use `--dry-run` to see what would be written:

```bash
opalspec init --tools cursor --dry-run
```

This is useful when installing into a repo that already has custom AI tool prompts or command files.

## What Gets Installed

These files are always installed:

```text
.opal/runtime/              # OpalSpec protocols, prompts, templates, scripts
.opal/specs/.gitkeep        # placeholder for per-change specs
.opal/docs/.gitkeep         # placeholder for developer docs
.opal/README.md
.opal/VERSION
AGENTS.md                   # OpalSpec instruction block between markers
```

Tool-specific files are installed based on `--tools`:

| Tool | Installed files |
|---|---|
| `codex` | `.codex/skills/opalspec/` |
| `claude` | `.claude/commands/opal/`, `.claude/skills/opalspec/` |
| `cursor` | `.cursor/commands/opal-*.md` |
| `gemini` | `.gemini/commands/opal/*.toml` |
| `github-copilot` | `.github/prompts/opal-*.prompt.md` |
| `plugin` | `plugins/opalspec/`, `.agents/plugins/marketplace.json` |

The `plugin` option is experimental.

## Codex Home Prompts

Codex can use the project skill installed at `.codex/skills/opalspec/`. OpalSpec also ships reusable Codex prompt files under:

```text
.opal/runtime/codex-prompts/
```

To install those into Codex home during init:

```bash
opalspec init --tools codex --install-codex-prompts
```

Or later:

```bash
opalspec install-codex-prompts
```

The CLI writes to `$CODEX_HOME/prompts/` when `CODEX_HOME` is set. Otherwise it writes to `~/.codex/prompts/`.

## Updating OpalSpec

To update an existing install:

```bash
opalspec update
```

`opalspec update` uses the OpalSpec CLI package that is currently running. It does not automatically fetch the newest package from npm first.

To update a repo with the latest published OpalSpec version, first update the global CLI:

```bash
npm install -g @opalspec/opalspec@latest
opalspec update
```

Or run the latest package directly without a global install:

```bash
npx @opalspec/opalspec@latest update
```

`opalspec update`:

1. Reads the target repo's `.opal/VERSION`.
2. Refreshes `.opal/runtime/` and other OpalSpec-owned files.
3. Updates only the OpalSpec block inside `AGENTS.md`.
4. Detects installed tool surfaces and refreshes them automatically.
5. Removes stale wrappers for renamed commands when needed.

You do not normally need to repeat `--tools` during update. The CLI detects what was previously installed.

## Adding Another Tool Later

If a repo already has OpalSpec and you want to add another tool surface:

```bash
opalspec add-tool cursor
```

Multiple tools:

```bash
opalspec add-tool cursor,github-copilot
```

## Checking An Install

Run:

```bash
opalspec doctor
```

The doctor checks for `.opal/VERSION`, `.opal/runtime/`, the OpalSpec `AGENTS.md` block, and installed tool surfaces.

## User Content Is Preserved

The installer treats these as user-authored content and does not overwrite them:

```text
.opal/specs/<change-name>/
.opal/docs/<topic>.md
AGENTS.md content outside the OpalSpec markers
```

These are OpalSpec-owned and can be overwritten on update:

```text
.opal/runtime/
.codex/skills/opalspec/
.claude/commands/opal/
.claude/skills/opalspec/
.cursor/commands/opal-*.md
.gemini/commands/opal/
.github/prompts/opal-*.prompt.md
plugins/opalspec/
```

If you need to customize runtime behavior, fork the relevant file into your own project-specific location instead of editing `.opal/runtime/` directly.

## Source-Checkout Fallback

If you are working from a source checkout and do not want to use npm, run the wrapper for your platform. Both delegate to the same Node CLI, so behavior is identical.

**macOS / Linux** — `install.sh` forwards all arguments to `bin/opalspec.js`:

```bash
./install.sh init --tools codex
./install.sh init --tools codex,claude --yes
./install.sh update --target /path/to/repo
./install.sh add-tool cursor --target /path/to/repo
./install.sh doctor --target /path/to/repo
```

Requires Node.js 20.19.0 or higher on `PATH`.

**Windows** — the original PowerShell installer:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\your\repo" -Tool codex
```

Update with:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\your\repo" -Update
```

## Troubleshooting

### Commands Do Not Appear

Restart or reload your AI tool after installation. Many tools scan commands, prompts, or skills only on startup.

### The CLI Requires `--tools`

First installs require a tool selection unless you explicitly run `--tools none`.

Updates can usually use only:

```bash
opalspec update
```

### I Want To See What Changed

Because OpalSpec is file-based, inspect the target repo with Git:

```bash
git status
git diff
```

Review the new `.opal/` files and tool-specific command files before committing.

### I Edited `.opal/runtime/` And Lost Changes

Runtime files are upstream-owned and refreshed on update. Keep project-specific guidance outside `.opal/runtime/`, or add custom instructions outside the OpalSpec block in `AGENTS.md`.
