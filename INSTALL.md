# Installing OpalSpec

This package installs reusable OpalSpec workflow files into another repository. The recommended installer is the cross-platform npm CLI:

```bash
npm install -g @opalspec/opalspec@latest
cd your-project
opalspec init --tools codex
```

Run without a global install:

```bash
npx @opalspec/opalspec@latest init --tools codex
```

On update, `opalspec update` detects and refreshes the OpalSpec tool surfaces already installed in the target repo.

If you prefer to work from a source checkout instead of installing via npm, use `install.sh` on macOS / Linux or `install.ps1` on Windows — see [Source-Checkout Fallback](#source-checkout-fallback) below.

## npm CLI

### Basic Install

```bash
opalspec init --tools claude
```

Multiple tools:

```bash
opalspec init --tools codex,claude,github-copilot
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

Use `--tools all` to install every supported surface, or `--tools none` to install only core `.opal/` runtime files and the `AGENTS.md` block.

### Preview Install

```bash
opalspec init --tools claude --dry-run
```

### Update Existing Install

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

### Add Another Tool Surface

```bash
opalspec add-tool cursor
```

### Install Codex Home Prompts

```bash
opalspec install-codex-prompts
```

or during init:

```bash
opalspec init --tools codex --install-codex-prompts
```

### Validate An Install

```bash
opalspec doctor
```

## What Gets Installed

Always installed:

- `.opal/runtime/` — protocols and prompts the agent reads (upstream-owned, overwritten on update).
- `.opal/specs/.gitkeep` and `.opal/docs/.gitkeep` — placeholders for your per-change specs and dev docs.
- `.opal/README.md` and `.opal/VERSION`.
- An `AGENTS.md` OpalSpec instruction block at the repo root, replaced safely between markers on update.

Conditional, picked per tool selection:

- `codex` → `.codex/skills/opalspec/` (project skill)
- `claude` → `.claude/commands/opal/` and `.claude/skills/opalspec/`
- `cursor` → `.cursor/commands/opal-*.md`
- `gemini` → `.gemini/commands/opal/*.toml`
- `github-copilot` → `.github/prompts/opal-*.prompt.md`
- `plugin` → `plugins/opalspec/` and `.agents/plugins/marketplace.json` (experimental)

Optional global install:

- `--install-codex-prompts` (npm CLI) / `-InstallCodexPrompts` (PowerShell) → copies `.opal/runtime/codex-prompts/opal-*.md` into `$CODEX_HOME/prompts/` (or `~/.codex/prompts/`).

## Source-Checkout Fallback

When working from a source checkout (no npm install), use the platform-appropriate wrapper. Both wrappers run the same Node CLI and accept the same subcommands and flags as the npm-installed `opalspec` binary, so behavior is identical across macOS, Linux, and Windows. Requires Node.js 20.19.0 or higher on `PATH`.

### Bash (macOS / Linux)

`install.sh` forwards all arguments to `bin/opalspec.js`:

```bash
./install.sh init --tools claude
./install.sh init --tools codex,claude,github-copilot --yes
./install.sh init --tools claude --dry-run
./install.sh init --tools codex --install-codex-prompts
./install.sh update --target /path/to/repo
./install.sh add-tool cursor --target /path/to/repo
./install.sh install-codex-prompts
./install.sh doctor --target /path/to/repo
```

Supported `--tools` values: `codex`, `claude`, `cursor`, `gemini`, `github-copilot`, `plugin`. Use `--tools all` for every surface or `--tools none` for only core `.opal/` files.

### PowerShell (Windows)

#### Basic Install

You must specify at least one `-Tool` value:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\repo" -Tool claude
```

Multiple tools (comma-separated):

```powershell
.\install.ps1 -TargetRepo "C:\path\to\repo" -Tool codex,claude,github-copilot
```

`-Tools` is accepted as an alias for `-Tool`.

#### Preview Install

Use `-WhatIf` to see what would be written:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\repo" -Tool claude -WhatIf
```

#### Install Codex Home Prompts

Codex prompt files must live in Codex home, matching the OpenSpec pattern. Install them with:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\repo" -Tool codex -InstallCodexPrompts
```

The installer uses `$CODEX_HOME/prompts/` when `CODEX_HOME` is set, otherwise `~/.codex/prompts/`.

#### Update Existing Install

To upgrade a repo using the PowerShell fallback, run from a fresh checkout of `OpalSpec`:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\repo" -Update
```

`-Update` does four things on top of a basic install:

1. Reads the target's `.opal/VERSION` and prints `Updating OpalSpec in <repo> from X to Y`. After install, the file is rewritten to the new version.
2. Refreshes the OpalSpec block inside `AGENTS.md` (the content between `<!-- OPALSPEC-INSTRUCTIONS-START -->` and `<!-- OPALSPEC-INSTRUCTIONS-END -->`). Everything outside those markers is left exactly as you had it.
3. Detects installed OpalSpec tool surfaces (`codex`, `claude`, `cursor`, `gemini`, `github-copilot`, `plugin`) and refreshes those automatically. You do not need to repeat `-Tool` values on update.
4. Overwrites OpalSpec-owned files (the same set as `-Force`) and removes stale wrappers for renamed commands such as `/opal:implement` → `/opal:build`.

If `-Tool` is supplied with `-Update` and installed tool surfaces are detected, the installer ignores `-Tool` and updates the detected surfaces. If no installed surfaces can be detected, it falls back to the supplied `-Tool` values.

`-Force` without `-Update` is still supported and behaves the same way as `-Update` for file overwrites, but doesn't print the version diff. Prefer `-Update` for upgrades.

To add a new tool surface to an already-installed repo, run a forced install for that tool:

```powershell
.\install.ps1 -TargetRepo "C:\path\to\repo" -Tool cursor -Force
```

## User Content Is Preserved

Regardless of install path, user-authored content is never touched:

- `.opal/specs/<change-name>/` (your specs) — never modified.
- `.opal/docs/<topic>.md` (your dev guides) — never modified.
- `AGENTS.md` content outside the OpalSpec markers — never modified.

> ⚠️ OpalSpec-owned files (everything under `.opal/runtime/`, plus the tool wrappers) are treated as upstream and are overwritten on update. If you need to customise the protocol, fork the file into your own location rather than editing in place.

## Package Layout

```text
install.sh        # source-checkout wrapper (macOS / Linux)
install.ps1       # source-checkout wrapper (Windows)
bin/opalspec.js   # Node CLI entrypoint
src/opalspec-cli.js
payload/
  .opal/
    runtime/
      spec-authoring-instructions.md
      new-instructions.md
      askme-instructions.md
      preflight-instructions.md
      playback-instructions.md
      change-protocol.md
      document-instructions.md
      command-manifest.md
      prompts/
      codex-prompts/
      scripts/          # install-codex-prompts.sh and .ps1
      templates/
    specs/.gitkeep
    docs/.gitkeep
    README.md
    VERSION
  .codex/skills/opalspec/
  .claude/commands/opal/
  .claude/skills/opalspec/
  .cursor/commands/
  .gemini/commands/opal/
  .github/prompts/
  plugins/opalspec/
  .agents/plugins/marketplace.json
  AGENTS.opal.md
```

## Notes

- Restart or reload your AI IDE after installation if command or skill discovery does not update automatically.
- Use `--dry-run` (npm CLI / bash) or `-WhatIf` (PowerShell) before installing into a repo with existing custom AI tool files.
- The installer is intentionally file-copy based; it does not require Python or a background service.
