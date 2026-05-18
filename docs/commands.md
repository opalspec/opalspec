# Commands

OpalSpec commands are invoked through your AI coding assistant. They are not a standalone terminal CLI. Each command points the agent at the right OpalSpec runtime instructions and tells it which stage of the workflow to run.

For workflow patterns, see [Workflows](workflows.md). For installation, see [Installation](installation.md). For tool-specific command syntax, see [Supported Tools](supported-tools.md).

## Quick Reference

| Stage | Command | Required? | Produces |
|---|---|---:|---|
| New spec | `/opal:new` | Yes | `.opal/specs/<change-name>/requirements.md` |
| Design | `/opal:design` | Yes | `.opal/specs/<change-name>/design.md` |
| Preflight | `/opal:preflight` | No | Read-only review feedback |
| Playback | `/opal:playback` | No | Guided design walkthrough |
| Tasks | `/opal:tasks` | No | `.opal/specs/<change-name>/tasks.md` |
| Build | `/opal:build` | Yes | Source changes, tests, task updates |
| Document | `/opal:document` | No | `.opal/docs/<topic>.md` |

For every stage after `/opal:new`, the spec name is optional. If omitted, the agent uses OpalSpec's active-spec rule:

1. If exactly one spec folder exists, use it.
2. If multiple spec folders exist, pick the most recently modified one and confirm.
3. If no spec exists, ask which spec to use.
4. An explicit spec name always wins.

## `/opal:new`

Start a new spec. This is the unified entry point for requirements.

```text
/opal:new "<change-name>" "<description>"
```

Both arguments are optional. The agent resolves a kebab-case name and a description before writing files.

What it does:

- Creates or reuses `.opal/specs/<change-name>/`.
- Asks whether to generate requirements in one pass or ask clarifying questions first.
- Writes `requirements.md`.
- Ends by asking whether you are ready for `/opal:design`.

Example:

```text
You: /opal:new "message-trash" "change message deletion so deleted messages move to trash before permanent deletion"

Agent: I'll create `message-trash`.
Would you like me to generate a draft requirements doc, or ask you questions to clarify direction first?
```

Use generate mode when the change is clear. Use askme mode when the idea needs shaping.

## `/opal:design`

Turn settled requirements into an implementation-facing design.

```text
/opal:design "<change-name>"
```

What it does:

- Reads `requirements.md`.
- Reads relevant source files and existing architecture.
- Writes or updates `design.md`.
- Captures goals, non-goals, decisions, architecture, interfaces, data models, correctness properties, error handling, and testing strategy.
- Ends by asking whether to play back, create tasks, or build directly.

Example:

```text
You: /opal:design message-trash

Agent: Reading requirements and existing message deletion flow...
Agent: Wrote `.opal/specs/message-trash/design.md`.
Ready for `/opal:playback`, `/opal:tasks`, or `/opal:build`?
```

## `/opal:preflight`

Run an optional read-only review after design and before implementation.

```text
/opal:preflight "<change-name>"
```

What it does:

- Reads requirements, design, tasks if present, and relevant code.
- Checks requirement coverage, architecture fit, interface risks, data risks, edge cases, testing gaps, sequencing, security/privacy, and maintainability.
- Produces feedback only.
- Does not edit specs.
- Does not implement code.

Preflight is intended for a different agent context than the one that authored the design. Use it as a second opinion before build.

Example verdicts:

```text
Ready
Ready with reservations
Not ready
```

## `/opal:playback`

Walk through the design with the user.

```text
/opal:playback "<change-name>"
```

What it does:

- Reads requirements, design, and the change protocol.
- Explains `design.md` section by section in plain language.
- Prompts after meaningful sections:

```text
Understood / Question / Don't understand / Stop?
```

Playback is useful when the design has tradeoffs, touches multiple layers, or was mostly AI-authored and you want a guided review.

If a question reveals a real design change, the agent follows the change protocol before continuing.

## `/opal:tasks`

Create an optional implementation checklist.

```text
/opal:tasks "<change-name>"
```

What it does:

- Reads requirements and design.
- Writes `tasks.md`.
- Groups implementation into numbered milestones and subtasks.
- Adds requirement traces like `_Requirements: 1.1, 2.3_`.
- Adds checkpoint tasks for meaningful verification points.

Tasks are recommended for larger work, multi-layer changes, risky migrations, or any implementation you may need to resume later. They are not required for small, well-scoped changes.

During build, `tasks.md` becomes the persistent resume ledger. The agent updates checkboxes as work completes.

## `/opal:build`

Implement the spec.

```text
/opal:build "<change-name>"
```

What it does:

- Reads `requirements.md`, `design.md`, and `tasks.md` if present.
- Reads `.opal/runtime/change-protocol.md`.
- Implements from `tasks.md` when present.
- Otherwise implements directly from `design.md`.
- Runs relevant verification when possible.
- Updates `tasks.md` checkboxes if tasks exist.
- Offers `/opal:document` when build finishes.

Build should not silently drift from the spec. If the codebase proves the plan wrong, the agent pauses, reports the mismatch, proposes spec edits, waits for approval, updates the docs, and resumes.

## `/opal:document`

Write or update a developer guide after implementation.

```text
/opal:document "<topic>"
```

What it does:

- Reads the active spec, shipped implementation files, and any existing `.opal/docs/<topic>.md`.
- Writes a human-facing guide under `.opal/docs/`.
- Explains what the area does, how it fits together, key flows, and how to extend it.
- Adds or updates the related specs list.

Specs are change-scoped. Developer docs are topic-scoped. Multiple specs can update the same topic doc over time.

## Tool Syntax

The canonical examples above use Claude-style slash commands. Other tools surface the same stages differently.

| Tool | Example |
|---|---|
| Claude Code | `/opal:new`, `/opal:build` |
| Cursor | `opal-new`, `opal-build` |
| Gemini CLI | `opal/new`, `opal/build` |
| GitHub Copilot | `opal-new.prompt.md`, `opal-build.prompt.md` |
| Codex | `$opalspec new <change-name>: <description>` or the installed OpalSpec skill |

See [Supported Tools](supported-tools.md) for details.

## Common Problems

### "The Agent Cannot Find A Spec"

Pass the spec name explicitly:

```text
/opal:design message-trash
```

Or check that the folder exists:

```text
.opal/specs/message-trash/
```

### "The Agent Wants To Build Too Early"

During requirements, design, preflight, playback, and tasks, the agent should not implement code unless you explicitly ask for implementation. Ask it to stay in the requested OpalSpec stage.

### "The Design Invented Behavior"

Design should not introduce behavior missing from requirements. Ask the agent to update `requirements.md` first, then revise `design.md`.

### "The Build Needs A Different Approach"

Use the change protocol. The agent should stop, explain the issue, propose exact spec edits, get your agreement, update docs, and resume from the updated plan.
