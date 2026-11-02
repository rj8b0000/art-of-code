---
name: kiro-spec-driven
description: Use this skill, in any language or stack (Node.js, .NET, Python, PHP, Rust, Go, Java, Ruby and more), whenever the user wants to plan a non-trivial feature before writing code with spec-driven development that is viewable in Kiro — requirements, then design, then a task breakdown, then incremental implementation, saved as a real Kiro spec under `.kiro/specs/`. Trigger on phrases like "write a spec for X", "create a Kiro spec", "spec-driven", "EARS requirements", "plan this feature", "break this into tasks before we build it", "I want to see it in Kiro", or when a request is clearly a feature of meaningful size and the user hasn't handed over a design. Also use it to resume, revise, or execute work already under `.kiro/specs/` — check that directory first. Do NOT use it for small well-understood changes, pure bug fixes, or when the user explicitly asks to just write the code.
---

# Kiro spec-driven development

Turns a feature idea into three reviewed artifacts — `requirements.md`, `design.md`, `tasks.md` — in the exact folder format the Kiro IDE reads, then implements them task by task. The goal is to catch misunderstandings while they are cheap to fix (a sentence in a requirements doc) rather than expensive (a wrong abstraction half-built). Keep each artifact as short as it can be while still being useful.

Project readiness and scaffolding rules live in `references/project-readiness.md`. Exact file formats live in `references/kiro-format.md`; EARS patterns in `references/ears.md`; ready-to-fill skeletons in `templates/`; how to find build/test commands and conventions for any language in `references/stack-detection.md`. Read them before writing the first artifact.

**Works in any language or stack** (Node.js, .NET, Python, PHP, Rust, Go, Java, Ruby, or a mix). The spec files are plain markdown plus one JSON line, so nothing about them is language-specific. Detect the stack from the project's own marker files, use its own build and test commands, and write design snippets in its own language. Never assume a stack; if the signals conflict or are missing, record that as an open question.

## Workflow

A readiness gate (phase 0) and then four phases, strictly in order. Phase 0 and each of the first three phases end with a **stop-and-wait approval gate** — do not advance, and do not start implementing, until the user explicitly approves. "Create a spec" or "write requirements for X" is a request for phase 1 only: stop there. Silence or a topic change is not approval.

```
[0 Project ready?] →(approve)→ [Requirements] →(approve)→ [Design] →(approve)→ [Tasks] →(approve)→ [Execution]
```

## Phase 0: Project readiness (always first)

**Write nothing under `.kiro/` until a real project exists to hold it.** Check the working folder for stack marker files, source files, or a git repo (`references/project-readiness.md` lists them per ecosystem). A folder that is empty, or holds only `.kiro/`, is not a project.

- **Project exists**: note its root (that is where `.kiro/` goes, next to its marker files, never in a parent folder), then continue to "Before starting".
- **No project**: stop and ask the user, in one short batch, for what is missing: stack and version, project name and folder, database or key dependencies, `git init` yes or no, and whether to scaffold now (default, so the design can inspect real code) or write the spec first with "scaffold the project" as Task 1. Show the exact scaffold commands and wait for approval; never scaffold, install or generate without it. Then scaffold with the ecosystem's standard generator, confirm it builds, and place `.kiro/` in that project's root.
- **Unclear target** (a parent folder with several projects, a monorepo): ask which one.
- **Secrets in the request** (a password, token or connection string): never write the value into any `.kiro/` file or committed source. Use a configuration key, store the value only in the stack's local untracked secret store with the user's approval, and tell the user where it went. See `references/project-readiness.md`.

## Before starting

1. **Feature name**: short kebab-case (`order-cancellation-flow`). The spec lives at `.kiro/specs/{feature-name}/`.
2. **Existing work**: if that folder exists, read it first. Never overwrite an existing `requirements.md`, `design.md` or `tasks.md`. Work out which phase it reached (requirements only = design is next; requirements + design = tasks are next), show the user, and ask: revise, continue, or start over. A resumed spec keeps its current `specId`.
3. **Steering**: read `.kiro/steering/*.md` if present (project product, tech and structure guidance). It informs requirements and design; follow it, don't restate it. Create steering files only when the user asks (see `templates/steering-*.md`).
4. **Workflow type** (goes in `.config.kiro`): `requirements-first` (default — requirements, design, tasks), `design-first` (technical design drives the requirements), or `fast-task` (small change, tasks only). Ask only if the user's intent is unclear.
5. **Spec id**: for a new spec, compute the next sequential id: `0001`, `0002`, ... (highest existing numeric `specId` under `.kiro/specs/*/.config.kiro` plus one, zero-padded to 4 digits; `0001` when there are none). Legacy non-numeric ids such as UUIDs are ignored for the count and left untouched. Never reuse or renumber an id. No runtime is required: `references/spec-id.md` gives a file-tools method plus bash and PowerShell snippets (and an optional Node script), so it works the same in any project, whatever its language.

6. Create `.kiro/specs/{feature-name}/.config.kiro` as a single line of JSON:

   ```json
   {"specId": "0001", "workflowType": "requirements-first", "specType": "feature"}
   ```

## Phase 1: Requirements

Pin down *what* to build and *how we will know it is done*, before any thought of *how*.

1. Ask clarifying questions only about what would change the design if answered differently (scope, users, edge cases, non-goals). A reasonable default beats a question.
2. Write `requirements.md` from `templates/requirements.md`: Introduction, Glossary, Assumptions and Open Questions, then one `### Requirement N` per capability with a user story and numbered EARS acceptance criteria. Use glossary terms as the subject of every criterion (`THE Invoice_Endpoint SHALL ...`).
3. Record unresolved questions as numbered assumptions (A1, A2...) and mark them `(RESOLVED)` once answered. Never invent an answer to a missing detail — list it as an open question.
4. Present the draft, wait for approval. If the user pushes back, revise and ask again.

## Phase 2: Design

Work out *how*, grounded in the codebase that exists, not a textbook architecture.

1. Inspect first: relevant modules, frameworks in use, `CLAUDE.md`, `.kiro/steering/`, similar features, existing tests and conventions. Identify the language and framework from marker files (`references/stack-detection.md`) and write interfaces and data models in that language.
2. Write `design.md` from `templates/design.md` at the depth the feature warrants (drop sections that don't apply): Overview with key decisions and rejected alternatives, Architecture, Components and Interfaces, Data Models, Correctness Properties (`*For any* ...` statements that map to property tests).
3. Present the draft, wait for approval. If feedback changes the approach, update `design.md` rather than carrying the delta only in conversation.

## Phase 3: Tasks

Turn the approved design into an ordered checklist, executable incrementally.

1. Write `tasks.md` from `templates/tasks.md`: `# Implementation Plan: {feature}`, Overview, Tasks, Notes, and a Task Dependency Graph (`waves` JSON).
2. Each task is small enough for one sitting, ordered so every step builds on a working state, test-driven where sensible, and ends with `_Requirements: 1.1, 2.3_` pointing at the criteria it satisfies. Mark optional test sub-tasks with a trailing `*` on the checkbox line, and add `Checkpoint - Ensure all tests pass` tasks at natural milestones.
3. The dependency graph groups task ids into waves; tasks within a wave have no dependency on each other.
4. Present the list and wait for approval. Approval is also the gate into implementation — never code against an unapproved `tasks.md`, and never implement at all if the user only asked for the spec.

## Phase 4: Execution

Work through `tasks.md` top to bottom, one task at a time:

1. Implement following the codebase's real conventions, not the spec's illustrative style.
2. Run the tests the task introduces or touches, using the project's own test command (from its README, `CLAUDE.md`, CI config or `references/stack-detection.md`). Report results honestly; a task is never done on a guess or an unrun test.
3. Tick the box (`- [x]`) in `tasks.md` as each task completes so the file always reflects real progress.
4. If a task is wrong or the design must change, stop and tell the user; a design-level surprise belongs back in `design.md`, not buried in a diff.
5. Check in at natural milestones on large or risky features; don't ask permission before every single task once execution is approved.

## Rules that keep specs Kiro-compatible

- Specs go in `.kiro/specs/` at the **project root** (phase 0), never in an empty folder, a parent of several projects, or anywhere else. Folder = kebab-case feature name.
- `.config.kiro` is required, one line, `specId` sequential and zero-padded.
- **Never create or edit `tasks.meta.json`** — Kiro generates it as runtime state (execution history, property-test results).
- Never write secrets, tokens, passwords or production hostnames into any spec or steering file; reference configuration keys instead.
- Do not copy an existing spec's content into a new one; match its structure, not its subject.
- Unknown or ambiguous project details are gaps to list under Assumptions and Open Questions, not things to guess.
