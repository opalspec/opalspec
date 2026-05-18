# Philosophy

OpalSpec is built around one idea: development workflows should create clarity without forcing unnecessary process.

It is a spec-driven development approach, but it is not a heavyweight methodology. It gives humans and AI agents enough structure to agree on intent, design, implementation, and documentation while keeping the workflow flexible enough for real software work.

## Clarity Before Code

AI coding agents are strongest when they have clear intent and enough context. They are weakest when they are asked to infer product behavior, architecture, edge cases, and constraints from a short prompt.

OpalSpec front-loads the thinking that matters:

- What should the system do?
- Why does this change exist?
- What behavior is in scope?
- What is explicitly out of scope?
- How should the implementation fit the existing codebase?
- What checks prove the work is done?

The goal is not to delay implementation. The goal is to reduce wrong turns before they become expensive.

## Flexible, Not Loose

Some development workflows are too loose. They rely on chat history, implicit decisions, and repeated correction.

Some are too rigid. They require every change to pass through the same amount of ceremony, even when the work is simple.

OpalSpec sits between those extremes.

The workflow has a clear shape:

```text
requirements -> design -> build
```

But it also lets you choose what the change actually needs:

- Ask clarifying questions, or generate requirements directly.
- Run playback, or skip it.
- Generate tasks, or build straight from design.
- Write developer docs, or finish without them.

Structure is useful. Rigid process is not the same as clarity.

## Specs Should Serve The Build

A spec is valuable only when it helps the work land better.

In OpalSpec:

- `requirements.md` captures behavior and acceptance criteria.
- `design.md` translates requirements into an implementation approach.
- `tasks.md` is optional and exists when sequencing or resumability matters.
- `.opal/docs/<topic>.md` captures the shipped system for future readers.

Each artifact has a job. If an artifact does not add value for a change, OpalSpec tries not to force it.

## Human And AI Collaboration

OpalSpec assumes modern development is often a collaboration between a human and an AI coding agent.

The human supplies intent, judgment, priorities, and taste. The agent can inspect the codebase, draft requirements, produce design options, implement changes, and keep documentation in sync.

The spec is the shared surface between them.

Because the spec is file-based markdown, it can be reviewed like code. You can pause, edit, disagree, ask for changes, or hand the work to a different agent without losing the thread.

## Documentation Should Be Human

Specs are change-scoped. They explain one piece of work.

Developer docs are system-scoped. They explain how an area works now.

OpalSpec keeps both because teams often lose context after implementation:

- Why was this behavior added?
- Which files own the flow?
- How should a future change extend it safely?
- What edge cases matter?

`/opal:document` exists to turn fresh implementation context into useful developer documentation before it disappears.

## Momentum Matters

OpalSpec should help teams move faster in the right direction. It should not become a gate that slows every change.

That is why optional stages stay optional.

For a small clear change, the right path may be:

```text
/opal:new -> /opal:design -> /opal:build
```

For a larger feature, the right path may include askme, playback, preflight, tasks, and documentation.

The measure is not "did we follow every step?" The measure is "did we create enough clarity to build well?"

## Practical Over Formal

OpalSpec is intentionally practical:

- Markdown files instead of a hosted system.
- Per-change spec folders instead of a master spec that must always be reconciled.
- Tool-specific command wrappers that point back to shared runtime instructions.
- Explicit change protocol when implementation reality diverges from the plan.
- Optional docs that explain the system for future developers.

It is a methodology delivered through a toolset, designed to make the approach easy to apply in real projects.

## The Short Version

OpalSpec exists to make spec-driven development feel simple, intuitive, and flexible.

It helps developers and AI agents move from idea to implementation with more shared context, less guesswork, and a better record of what was built.
