# Getting Started

OpalSpec is a lightweight spec-driven development workflow for AI coding agents. It gives your agent a clear path from intent to implementation without turning every change into a heavyweight process.

This guide walks through the first useful flow: install OpalSpec into a repo, start a spec, produce requirements, design the change, build it, and optionally document what shipped.

## What OpalSpec Adds

Most AI coding work starts with a prompt and jumps straight to edits. That works for tiny changes, but it breaks down when the work has hidden decisions, cross-file behavior, edge cases, or future maintainers.

OpalSpec adds a small file-based workflow:

```text
.opal/
  specs/<change-name>/
    requirements.md
    design.md
    tasks.md          # optional
  docs/<topic>.md     # optional developer guides
  runtime/            # OpalSpec instructions and command prompts
```

Each spec is ordinary markdown. You can review it, edit it, commit it, and use it with any supported AI coding tool.

## Install OpalSpec

Install the OpalSpec CLI:

```bash
npm install -g @opalspec/opalspec@latest
```

Then initialize OpalSpec in the repository where you want to use the workflow:

```bash
cd your-project
opalspec init --tools codex
```

Replace `codex` with the tool you use:

```text
codex
claude
cursor
gemini
github-copilot
plugin
```

You can install more than one tool surface at the same time:

```bash
opalspec init --tools codex,claude,cursor
```

You can also run without a global install:

```bash
npx @opalspec/opalspec@latest init --tools codex
```

After installation, reload your AI coding tool so it discovers the new commands, prompts, or skills.

## Start Your First Spec

Open the target repo in your AI coding agent and start with:

```text
/opal:new "message-trash" "change message deletion so deleted messages move to a trash area first, where they can be restored or permanently deleted"
```

Both arguments are optional. If you do not provide a name or description, the agent asks for the missing details.

`/opal:new` creates a spec folder under:

```text
.opal/specs/message-trash/
```

Before writing requirements, the agent asks:

```text
Would you like me to generate a draft requirements doc, or ask you questions to clarify direction first?
```

Choose the path that fits the change:

| Mode | Best when | Result |
|---|---|---|
| Generate | You already know the shape of the change | The agent drafts `requirements.md` in one pass |
| Ask questions | The idea has open decisions or fuzzy terminology | The agent interviews you one question at a time, then writes `requirements.md` |

Both paths produce the same kind of requirements document.

## Move To Design

When requirements look right, run:

```text
/opal:design
```

The agent reads `requirements.md`, inspects the relevant codebase, and writes:

```text
.opal/specs/message-trash/design.md
```

The design explains the implementation approach: affected files, components, interfaces, data models, correctness properties, error handling, and testing strategy.

After design, OpalSpec intentionally gives you choices:

```text
/opal:build       # implement directly from design.md
/opal:tasks       # optional task plan first
/opal:playback    # optional guided design walkthrough
/opal:preflight   # optional second-agent review
```

## Optional Review Steps

You do not need every optional step for every change.

Use `/opal:playback` when you want the agent to walk through the design section by section and check that you understand and agree with it.

Use `/opal:preflight` when you want a read-only second opinion on the design before implementation. It is intended for a different agent context than the one that authored the design.

Use `/opal:tasks` when the change is large enough to benefit from a numbered implementation checklist. Tasks are optional; `/opal:build` can work directly from `design.md`.

## Build

Run:

```text
/opal:build
```

The agent reads:

```text
.opal/specs/message-trash/requirements.md
.opal/specs/message-trash/design.md
.opal/specs/message-trash/tasks.md   # if present
.opal/runtime/change-protocol.md
```

If `tasks.md` exists, it becomes the resume ledger. The agent checks off tasks as it completes them.

If `tasks.md` does not exist, the agent builds from `design.md` in dependency order.

If implementation reveals that the spec is wrong or incomplete, OpalSpec uses the change protocol: the agent stops, explains the mismatch, proposes exact spec edits, waits for your agreement, updates the docs, and then resumes.

## Optional Documentation

After build, the agent offers:

```text
/opal:document <topic>
```

This writes or updates:

```text
.opal/docs/<topic>.md
```

These docs are different from specs. Specs describe one change. Developer docs explain the resulting system for future maintainers.

## Picking The Right Path

Use the lightest workflow that still gives useful clarity.

| Change type | Suggested path |
|---|---|
| Tiny typo, rename, obvious one-line fix | Do not use OpalSpec unless you want a record |
| Small feature or bugfix | `/opal:new` -> `/opal:design` -> `/opal:build` |
| Medium cross-file change | `/opal:new` -> `/opal:design` -> optional playback or preflight -> `/opal:build` |
| Larger feature or risky change | `/opal:new` askme mode -> `/opal:design` -> `/opal:preflight` -> `/opal:playback` -> `/opal:tasks` -> `/opal:build` -> `/opal:document` |

OpalSpec is there when structure helps. It is not a rule that every commit must pass through every stage.

## Next Steps

- Read [Commands](commands.md) for the full command reference.
- Read [Workflows](workflows.md) for common paths through the stages.
- Read [Supported Tools](supported-tools.md) for tool-specific command syntax.
- Read [Philosophy](philosophy.md) for the principles behind the workflow.
