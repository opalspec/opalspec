# Supported Tools

OpalSpec works with AI coding tools that can read local files and follow project instructions. The installer writes tool-specific command, prompt, or skill files so each tool can invoke the same OpalSpec workflow.

All tools ultimately point back to `.opal/runtime/`, which is the shared source of truth for the workflow.

## Supported Tool Values

Use these values with the installer:

```text
codex
claude
cursor
gemini
github-copilot
plugin
```

Example:

```bash
opalspec init --tools codex,claude,cursor
```

## Tool Matrix

| Tool | Installer value | Installed surface | Example invocation |
|---|---|---|---|
| Codex | `codex` | `.codex/skills/opalspec/` | `$opalspec new message-trash: move deleted messages to trash first` |
| Claude Code | `claude` | `.claude/commands/opal/`, `.claude/skills/opalspec/` | `/opal:new`, `/opal:build` |
| Cursor | `cursor` | `.cursor/commands/opal-*.md` | `opal-new`, `opal-build` |
| Gemini CLI | `gemini` | `.gemini/commands/opal/*.toml` | `opal/new`, `opal/build` |
| GitHub Copilot | `github-copilot` | `.github/prompts/opal-*.prompt.md` | `opal-new.prompt.md` |
| Local plugin | `plugin` | `plugins/opalspec/`, `.agents/plugins/marketplace.json` | Experimental |

## Codex

Install:

```bash
opalspec init --tools codex
```

This installs a project skill:

```text
.codex/skills/opalspec/SKILL.md
```

Codex skill-style prompts:

```text
$opalspec new <change-name>: <description>
$opalspec create design for <change-name>
$opalspec preflight <change-name>
$opalspec play back design for <change-name>
$opalspec create tasks for <change-name>
$opalspec build <change-name>
$opalspec document <topic>
```

Optional Codex home prompt files can be installed with:

```bash
opalspec init --tools codex --install-codex-prompts
```

## Claude Code

Install:

```bash
opalspec init --tools claude
```

Installed files:

```text
.claude/commands/opal/
.claude/skills/opalspec/
```

Canonical commands:

```text
/opal:new
/opal:design
/opal:preflight
/opal:playback
/opal:tasks
/opal:build
/opal:document
```

## Cursor

Install:

```bash
opalspec init --tools cursor
```

Installed files:

```text
.cursor/commands/opal-new.md
.cursor/commands/opal-design.md
.cursor/commands/opal-preflight.md
.cursor/commands/opal-playback.md
.cursor/commands/opal-tasks.md
.cursor/commands/opal-build.md
.cursor/commands/opal-document.md
```

Use the command names exposed by Cursor, such as:

```text
opal-new
opal-build
```

## Gemini CLI

Install:

```bash
opalspec init --tools gemini
```

Installed files:

```text
.gemini/commands/opal/new.toml
.gemini/commands/opal/design.toml
.gemini/commands/opal/preflight.toml
.gemini/commands/opal/playback.toml
.gemini/commands/opal/tasks.toml
.gemini/commands/opal/build.toml
.gemini/commands/opal/document.toml
```

Gemini command names follow the `opal/<stage>` pattern.

## GitHub Copilot

Install:

```bash
opalspec init --tools github-copilot
```

Installed files:

```text
.github/prompts/opal-new.prompt.md
.github/prompts/opal-design.prompt.md
.github/prompts/opal-preflight.prompt.md
.github/prompts/opal-playback.prompt.md
.github/prompts/opal-tasks.prompt.md
.github/prompts/opal-build.prompt.md
.github/prompts/opal-document.prompt.md
```

These prompt files are intended for GitHub Copilot environments that support repository prompt files.

## Experimental Plugin

Install:

```bash
opalspec init --tools plugin
```

Installed files:

```text
plugins/opalspec/
.agents/plugins/marketplace.json
```

This path is experimental. For Codex, the project skill plus optional Codex home prompts are the stable path.

## Agent-Agnostic Use

Even if a tool does not have a first-class OpalSpec wrapper, it can still use the workflow if it can read files and follow instructions.

Point the agent at:

```text
.opal/runtime/spec-authoring-instructions.md
.opal/runtime/command-manifest.md
```

Then ask it to run the relevant stage. The exact command surface may differ, but the artifacts and workflow rules stay the same.
