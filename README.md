# claude-kiro-spec-driven

A Claude Code plugin with two skills:

- **`kiro-spec-driven`** — spec-driven development (requirements, design, tasks, implementation) that writes **real Kiro specs** under `.kiro/specs/`, so the result opens natively in the [Kiro](https://kiro.dev) IDE. Specs get sequential ids (`0001`, `0002`, ...).
- **`postman-collection`** — creates and updates a Postman collection and its Local/Production environments for an HTTP API, from an OpenAPI document or from the controllers, with bearer auth and auto-login built in.

Independent community project; not an official Anthropic or Kiro product.

## Install

In Claude Code:

```
/plugin marketplace add rj8b0000/claude-kiro-spec-driven
/plugin install kiro-spec-driven@claude-kiro-spec-driven
```

Verify with `/plugin` (Installed tab), or type `/` and look for `/kiro-spec-driven:kiro-spec-driven` and `/kiro-spec-driven:postman-collection`. If the repo is private, each person needs their own GitHub read access (SSH key or HTTPS credential) configured in git.

## Use

Both skills trigger automatically from the task description, or run them explicitly:

```
/kiro-spec-driven:kiro-spec-driven      write a spec for "order cancellation flow"
/kiro-spec-driven:postman-collection    create a Postman collection for this API
```

### Spec-driven workflow

```
idea → Requirements →(approve)→ Design →(approve)→ Tasks →(approve)→ Execution
```

Each phase ends with an approval gate. Output lands in your project:

```
.kiro/specs/<feature>/
  .config.kiro      {"specId": "0001", "workflowType": "requirements-first", "specType": "feature"}
  requirements.md   Introduction, Glossary, Assumptions, Requirements with EARS criteria
  design.md         Overview, Architecture, Components, Data Models, Correctness Properties
  tasks.md          checkbox plan with requirement links and a dependency graph
```

Open the project in Kiro and the spec appears in its specs panel. Details: [docs/kiro-spec-driven.md](docs/kiro-spec-driven.md).

### Postman collections

Creates or updates a collection from an OpenAPI document (via the Postman CLI) or from controllers, keeping hand-added scripts, removing requests for deleted endpoints, and wiring Bearer `{{accessToken}}` with an auto-login pre-request script. Real credentials are never written to files. Details: [docs/postman-collection.md](docs/postman-collection.md).

## Repository layout

```
.claude-plugin/marketplace.json
plugins/kiro-spec-driven/
  .claude-plugin/plugin.json
  skills/kiro-spec-driven/     SKILL.md, templates/, references/, scripts/next-spec-id.mjs
  skills/postman-collection/   SKILL.md, references/ (scripts, skeleton collection, conventions)
docs/                          usage and per-skill guides
```

More: [docs/usage.md](docs/usage.md).

## License

MIT. See [LICENSE](LICENSE).
