# Workflows

OpalSpec is stage-based, but it is not rigid. The normal path is:

```text
/opal:new -> /opal:design -> /opal:build
```

Optional stages help when the work needs more clarity:

```text
/opal:preflight   # second-agent design review
/opal:playback    # guided design walkthrough
/opal:tasks       # implementation checklist
/opal:document    # developer guide after build
```

Use the smallest path that gives the change enough context.

## The Core Flow

```text
Idea
  -> /opal:new
  -> requirements.md
  -> /opal:design
  -> design.md
  -> /opal:build
  -> implementation
```

This is enough for many small and medium changes. Requirements capture what the system should do. Design captures how the implementation should work. Build turns that plan into code.

## The Full Flow

```text
Idea
  -> /opal:new
       -> generate requirements
       -> or ask questions first
  -> requirements.md
  -> /opal:design
  -> design.md
  -> optional /opal:preflight
  -> optional /opal:playback
  -> optional /opal:tasks
  -> /opal:build
  -> optional /opal:document
```

Use the full flow when a change has cross-layer behavior, important decisions, data migration risk, security/privacy implications, or multiple contributors.

## Workflow: Small Well-Scoped Change

Example: add a small UI state, rename a visible label, add a simple validation rule.

```text
/opal:new "empty-state-copy" "update the project empty state to explain how to create the first project"
/opal:design
/opal:build
```

Skip tasks unless the change has enough steps that a checklist will help.

Skip playback and preflight unless the design is more complex than expected.

## Workflow: Fuzzy Product Idea

Example: "make notifications easier to manage" or "improve onboarding".

```text
/opal:new "notification-management" "make notifications easier for users to manage"
```

When asked whether to generate or ask questions, choose ask questions.

AskMe mode is useful because it:

- Asks one high-leverage question at a time.
- Recommends answers instead of asking blank-page questions.
- Searches the code before asking things the code can answer.
- Writes `requirements.md` as decisions land.
- Captures the `Why` section after the shape is clear.

Then continue:

```text
/opal:design
/opal:playback
/opal:build
```

## Workflow: Larger Cross-Layer Feature

Example: message trash, billing plan changes, search ranking, offline sync.

```text
/opal:new "message-trash" "deleted messages should move to trash first, then be restorable or permanently deleted"
/opal:design
/opal:preflight
/opal:playback
/opal:tasks
/opal:build
/opal:document "message-lifecycle"
```

Why this path works:

- Requirements keep behavior and edge cases explicit.
- Design connects the behavior to real files, modules, interfaces, and data models.
- Preflight gives a second agent a chance to catch design risks.
- Playback helps the human understand and challenge the plan.
- Tasks create a resume ledger for implementation.
- Documentation captures the shipped system for future maintainers.

## Workflow: Skip Tasks And Build From Design

Tasks are optional. If a design is clear and the implementation is small enough, go straight to:

```text
/opal:build
```

The build agent should still read `requirements.md`, `design.md`, and the change protocol before editing code.

Use this path when:

- The work is local to a small set of files.
- The design has obvious implementation order.
- You do not need a durable task ledger.
- You are unlikely to pause and resume midway through implementation.

## Workflow: Preflight As A Second Opinion

Preflight is deliberately read-only. It should not be run by the same agent context that wrote the design unless you have no alternative.

Suggested pattern:

1. Agent A writes `design.md`.
2. Open a separate agent context.
3. Run:

```text
/opal:preflight <change-name>
```

4. Paste the feedback back to Agent A.
5. Ask Agent A to reason over the findings and update the design where appropriate.

Preflight is valuable when the design includes:

- Persistence or migrations
- Data deletion or retention
- Auth, permissions, or privacy
- External APIs
- Cross-layer changes
- Complex test strategy
- Concurrency or race conditions

## Workflow: Playback As Design Review

Playback is a structured review conversation.

The agent explains a meaningful design section, then asks:

```text
Understood / Question / Don't understand / Stop?
```

Use:

- `Understood` to continue.
- `Question` to challenge, probe, or ask why.
- `Don't understand` to ask for a clearer explanation.
- `Stop` to end the walkthrough early and move to final questions.

Playback is especially useful for AI-authored designs because it forces the design to become explainable before implementation starts.

## Workflow: Build With Change Protocol

During build, the spec is the source of truth. But implementation can reveal that the source of truth is incomplete or wrong.

When that happens, the agent should not silently drift.

It should:

1. Stop before making divergent code changes.
2. Report what it found.
3. Name the affected requirements, design sections, or tasks.
4. Propose exact spec edits.
5. Wait for your agreement.
6. Update docs in order: requirements, design, tasks if present.
7. Resume implementation.

This keeps the spec useful after implementation, not just before it.

## Workflow: Documentation After Build

Run:

```text
/opal:document "message-lifecycle"
```

Use documentation when:

- The change creates a system area others will need to understand.
- The implementation has important flows, constraints, or extension points.
- Future AI sessions will benefit from stable context.
- You want a topic-level guide rather than a change-level spec.

`.opal/docs/<topic>.md` should explain the current system, not copy the spec verbatim.

## When Not To Use OpalSpec

Do not force OpalSpec around every edit.

You probably do not need a spec for:

- Typos
- Formatting-only changes
- Obvious one-line constants
- Local refactors with no behavioral impact
- Experiments you expect to throw away immediately

Use OpalSpec when clarity pays for itself: features, meaningful behavior changes, shared systems, AI-assisted implementation, and work someone may need to understand later.
