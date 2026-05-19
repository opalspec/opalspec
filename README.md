# OpalSpec

OpalSpec is a lightweight spec-driven development framework for AI-assisted coding workflows. It helps you turn intent into requirements, design, implementation, and documentation without forcing unnecessary ceremony.

OpalSpec codifies existing manual workflows in which developers are guiding AI to help shape a plan, create a design, and support implementation. What OpalSpec adds is consistency, repeatability, and a lasting record of the work, while staying flexible enough to fit different developers, teams, and types of change.

Unlike heavier process-driven approaches, OpalSpec does not assume one workflow fits every change. Use it where structure adds value, skip it where it does not, and keep your process as lightweight as the work allows.

## How it works

You do not need to use OpalSpec for every change, and OpalSpec does not enforce a master spec. Code remains the executable source of truth. Specs capture the intent, decisions, and context around a change; docs explain how the finished system works. This reduces overhead, avoids unnecessary AI reconciliation, and keeps the workflow practical.

For changes suited to a spec-driven flow — features, larger refactors, AI-assisted work, or anything that benefits from clear intent — OpalSpec gives the agent the context it needs to produce more relevant results, while leaving a lasting record that makes the work easier to review, maintain, and extend.

OpalSpec has three core steps: **requirements**, **design**, and **implementation**.

Requirements define what needs to be built and why, giving both the developer and the agent a clear understanding of the intended change. Design explains how the change should be approached, including the structure, important decisions, and constraints the implementation should follow. Implementation is where the agent uses that context to make the change in the codebase, producing results guided by the spec rather than a loose prompt.

Only the core flow is required: create the spec, design the solution, then implement the change. Other steps, such as clarifying questions, preflight review, playback, task generation, and documentation, are optional and can be used when they add value.

## Commands

### Core flow

- **`/opal:new`** — Create a new spec and generate requirements. Use this when you want to define the change clearly before design or implementation begins.

- **`/opal:design`** — Create an implementation-facing design from the requirements. Use this when you want the agent to understand the codebase, plan the approach, and capture key decisions before writing code.

- **`/opal:build`** — Implement the change from the spec. Use this when the requirements and design are clear and you are ready for the agent to update the codebase.

### Optional steps

- **`/opal:preflight`** — Review the spec before implementation without changing code. Use this when you want a second opinion on coverage, risks, edge cases, and readiness.

- **`/opal:playback`** — Walk through the design step by step in plain language. Use this when you want to understand, review, or challenge the design before build.

- **`/opal:tasks`** — Break the design into an implementation checklist. Use this for larger or riskier changes where sequencing, checkpoints, or resumability matter.

- **`/opal:document`** — Create or update developer documentation after the build. Use this when the finished work should be easy for future contributors to understand, maintain, or extend.

## Learn more

New to OpalSpec? Start with the [Getting Started](docs/getting-started.md) guide for a first end-to-end flow from install to build. For setup details, see [Installation](docs/installation.md), then use [Commands](docs/commands.md) as the quick reference for each OpalSpec stage.

To understand how OpalSpec is structured, read [The `.opal` Folder](docs/opal.md). For choosing the right level of process for different kinds of work, see [Workflows](docs/workflows.md). If you want to understand the thinking behind the project, read [Philosophy](docs/philosophy.md). For tool-specific command syntax across Codex, Claude Code, Cursor, Gemini, GitHub Copilot, and plugins, see [Supported Tools](docs/supported-tools.md).

## Install

Install the OpalSpec CLI with npm:

```bash
npm install -g @opalspec/opalspec@latest
```

Then initialize OpalSpec in your project:

```bash
cd your-project
opalspec init --tools codex
```

Use the tools you actually use:

```bash
opalspec init --tools codex,claude,cursor
```

You can also run without a global install:

```bash
npx @opalspec/opalspec@latest init --tools codex
```

See [INSTALL.md](INSTALL.md) for update, migration, and fallback PowerShell installer details.