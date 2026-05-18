---
agent: agent
description: Run a read-only preflight review of an OpalSpec design before implementation
---

First read `.opal/runtime/spec-authoring-instructions.md` and `.opal/runtime/preflight-instructions.md`, and follow them for this request.

The spec name argument is optional; if omitted, follow the spec inference rule in `.opal/runtime/spec-authoring-instructions.md`.

Confirm `.opal/specs/<change-name>/requirements.md` and `design.md` exist. Stop if the spec is not at design stage.

Read requirements, design, `tasks.md` if present, and relevant source files.

Review design against the codebase for issues or red flags and gaps in the plan. Review requirement coverage, architecture fit, interface/data risks, error handling, testing gaps, sequencing, security/privacy, and maintainability.

Return findings, key improvements, questions for the original agent, checks performed, and residual risk.

Do not edit specs or source files. Do not create `tasks.md`. Do not implement code.
