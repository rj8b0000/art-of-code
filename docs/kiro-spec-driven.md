# Skill: kiro-spec-driven

Spec-driven development that produces real Kiro specs.

## Workflow

```
idea → [Requirements] →(approve)→ [Design] →(approve)→ [Tasks] →(approve)→ [Execution]
```

Every phase ends with a stop-and-wait gate. "Write a spec" means phase 1 only. A topic change or silence is not approval. An existing `requirements.md`, `design.md` or `tasks.md` is never overwritten; the skill reads what is there, works out which phase it reached, and asks whether to revise, continue or start over.

## Output format

Everything lands in `.kiro/specs/<kebab-feature-name>/`:

| File | Content |
|---|---|
| `.config.kiro` | One-line JSON: `specId`, `workflowType` (`requirements-first`, `design-first`, `fast-task`), `specType` (`feature`) |
| `requirements.md` | Introduction, Glossary (snake_case terms), Assumptions and Open Questions, numbered Requirements with user stories and EARS acceptance criteria |
| `design.md` | Overview with key decisions, Architecture, Components and Interfaces, Data Models, Error Handling, Correctness Properties, Testing Strategy |
| `tasks.md` | Checkbox plan, `_Requirements:_` links, optional `*` test tasks, checkpoints, dependency-graph `waves` JSON |

`tasks.meta.json` is Kiro's own runtime state; the skill never creates or edits it.

## Sequential spec ids

`specId` is `0001`, `0002`, ... : the highest existing purely numeric `specId` under `.kiro/specs/*/.config.kiro`, plus one, zero-padded to four digits (`0001` when none exist). Non-numeric legacy ids such as UUIDs are ignored for counting and left alone. Resuming a spec keeps its id. No runtime is required: `references/spec-id.md` gives a file-tools method plus bash and PowerShell snippets that work in any project, and `scripts/next-spec-id.mjs` is an optional Node version:

```bash
node plugins/kiro-spec-driven/skills/kiro-spec-driven/scripts/next-spec-id.mjs <projectRoot>
```

## Any language

Specs are markdown plus one JSON line, so they are the same for every stack. The skill detects the language from marker files (`package.json`, `*.csproj`, `pyproject.toml`, `composer.json`, `Cargo.toml`, `go.mod`, `pom.xml`, `Gemfile`), runs the project's own build and test commands, uses its existing test and property-test tooling, and writes interfaces and data models in its language. Where signals conflict or are missing it records an open question instead of guessing. Reference: `references/stack-detection.md`.

## EARS acceptance criteria

Five patterns (ubiquitous, WHEN, WHILE, IF/THEN, WHERE) with glossary terms as subjects, so every criterion reads as a test case. Reference: `references/ears.md`.

## Steering files

On request the skill creates `.kiro/steering/product.md`, `tech.md` and `structure.md` from templates, with `inclusion:` frontmatter. Steering files hold facts and conventions only: never credentials, tokens or production hostnames.

## Execution rules

Tasks run top to bottom; tests are run and reported honestly; boxes are ticked as work completes; a design-level surprise stops the run and goes back into `design.md`.
