# The `.opal` Folder

OpalSpec is file-based. Installing it into a repository creates a `.opal/` folder that holds workflow runtime files, per-change specs, and optional developer docs.

This page explains what belongs in `.opal/`, what you should commit, and which files are owned by OpalSpec.

## Layout

```text
.opal/
  VERSION
  README.md
  runtime/
    spec-authoring-instructions.md
    new-instructions.md
    askme-instructions.md
    preflight-instructions.md
    playback-instructions.md
    change-protocol.md
    document-instructions.md
    command-manifest.md
    templates/
    prompts/
    codex-prompts/
    scripts/
  specs/
    <change-name>/
      requirements.md
      design.md
      tasks.md
  docs/
    <topic>.md
```

## `.opal/runtime/`

Runtime files are the instructions your AI tool reads when running OpalSpec commands.

Examples:

- `spec-authoring-instructions.md` defines the core requirements/design/tasks rules.
- `new-instructions.md` defines the `/opal:new` flow.
- `askme-instructions.md` defines the interactive requirements interview.
- `preflight-instructions.md` defines read-only design review.
- `playback-instructions.md` defines the design walkthrough.
- `change-protocol.md` defines what the agent must do when implementation diverges from the spec.
- `document-instructions.md` defines developer documentation output.
- `command-manifest.md` maps stages to tool-specific command surfaces.

These files are OpalSpec-owned. Updates can overwrite them. Do not put project-specific custom workflow changes here unless you are comfortable maintaining them across updates.

## `.opal/specs/`

Specs are user-authored project content. Each change gets its own folder:

```text
.opal/specs/message-trash/
  requirements.md
  design.md
  tasks.md
```

Commit these files with the code they describe. They are part of the project record.

### `requirements.md`

Requirements describe observable behavior and constraints.

They usually include:

- Introduction
- Why
- Glossary
- Numbered requirements
- EARS-style acceptance criteria using `WHEN`, `IF`, `THEN`, and `SHALL`

Requirements should explain what the system must do without over-specifying implementation.

### `design.md`

Design translates requirements into an implementable approach.

It usually includes:

- Overview
- Goals and non-goals
- Decisions
- Architecture
- Components and interfaces
- Data models
- Correctness properties
- Error handling
- Testing strategy

Design should be grounded in the actual codebase. The agent should inspect relevant source files before writing it.

### `tasks.md`

Tasks are optional.

Use them when the work is large enough to need sequencing, resumability, or a durable checklist.

During `/opal:build`, `tasks.md` becomes a resume ledger. The agent updates checkboxes as implementation progresses.

## `.opal/docs/`

Developer docs are optional topic-level guides.

Example:

```text
.opal/docs/message-lifecycle.md
```

Specs explain one change. Docs explain a system area as it exists after one or more changes.

Use `/opal:document <topic>` after build when the implementation creates context future developers should know.

## Tool Surfaces Outside `.opal`

OpalSpec also installs command wrappers or skills outside `.opal/`, depending on selected tools:

```text
.codex/skills/opalspec/
.claude/commands/opal/
.claude/skills/opalspec/
.cursor/commands/
.gemini/commands/opal/
.github/prompts/
plugins/opalspec/
.agents/plugins/marketplace.json
```

These wrappers are intentionally thin. They point agents back to the canonical runtime files in `.opal/runtime/`.

## What To Commit

Commit:

- `.opal/specs/<change-name>/`
- `.opal/docs/<topic>.md`
- Installed runtime and tool files if your team wants OpalSpec available in the repo
- `AGENTS.md` with the OpalSpec instruction block

Do not commit machine-local settings that are not part of the project. OpalSpec itself does not require a background local state file.

## Ownership Rules

| Path | Owner | Updated by installer? |
|---|---|---:|
| `.opal/runtime/` | OpalSpec | Yes |
| `.opal/specs/<change-name>/` | Your project | No |
| `.opal/docs/<topic>.md` | Your project | No |
| `AGENTS.md` OpalSpec block | OpalSpec | Yes |
| `AGENTS.md` outside OpalSpec block | Your project | No |
| Tool command wrappers | OpalSpec | Yes |

When in doubt, keep project-specific guidance outside OpalSpec-owned paths.
