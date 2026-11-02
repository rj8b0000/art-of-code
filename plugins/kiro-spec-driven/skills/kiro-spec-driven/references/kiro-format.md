# Kiro spec folder format

A spec is a folder under `.kiro/specs/{kebab-feature-name}/`:

```
.kiro/
  specs/
    order-cancellation-flow/
      .config.kiro        required
      requirements.md
      design.md
      tasks.md
      tasks.meta.json     Kiro-generated, never author it
  steering/
    product.md  tech.md  structure.md   optional project guidance
```

## `.config.kiro`

One line of JSON:

```json
{"specId": "0001", "workflowType": "requirements-first", "specType": "feature"}
```

- `specId`: sequential, zero-padded to 4 digits (`0001`, `0002`, ...). Next id = highest existing purely numeric `specId` + 1. Legacy ids that are not purely numeric (for example UUIDs written by older tooling) are ignored for counting and never renumbered. A resumed spec keeps its id. `references/spec-id.md` gives runtime-free ways to compute it (file tools, bash, PowerShell); `scripts/next-spec-id.mjs` is an optional Node version.
- `workflowType`: `requirements-first` | `design-first` | `fast-task`.
- `specType`: `feature`.

## `requirements.md`

No frontmatter. Order: `# Requirements Document`, `## Introduction`, `## Glossary` (bold snake_case terms), `## Assumptions and Open Questions` (A1, A2 ... marked `(RESOLVED)` once answered), then repeated `### Requirement N: Title` blocks each with `**User Story:**` and `#### Acceptance Criteria` (numbered EARS, see `ears.md`).

## `design.md`

No frontmatter. Sections: Overview (with key design decisions and rationale), Architecture, Components and Interfaces, Data Models, Error Handling, Correctness Properties (`### Property N: Title`, body starting `*For any* ...`, ending `**Validates: Requirements X.Y**`), Testing Strategy. Drop sections that do not apply.

## `tasks.md`

No frontmatter. `# Implementation Plan: {feature}`, `## Overview`, `## Tasks`, `## Notes`, `## Task Dependency Graph`.

- Parent task: `- [ ] 1. Title`; sub-task nested two spaces: `  - [ ] 1.1 Title`; detail bullets beneath; each task ends with `_Requirements: 1.1, 2.3_`.
- Status: `[ ]` not started, `[x]` done. Optional test tasks carry a trailing `*`: `- [ ]* 1.3 Write property test ...`.
- Checkpoints: `- [ ] 4. Checkpoint - Ensure all tests pass`.
- Dependency graph is a fenced `json` block `{"waves":[{"id":0,"tasks":["1.1"]}]}`; tasks in one wave are independent of each other.

## `tasks.meta.json`

Runtime state written by Kiro (property-test results, execution history keyed by task title). Treat as read-only: never create, edit or delete it.

## Steering files

Plain markdown under `.kiro/steering/`. Optional frontmatter `inclusion: always` (default when absent) or `inclusion: manual`. Facts and conventions only; no secrets, credentials or production hostnames.
