# art-of-code

A Claude Code plugin with four skills:

- **`kiro-spec-driven`** — spec-driven development (requirements, design, tasks, implementation) that writes **real Kiro specs** under `.kiro/specs/`, so the result opens natively in the [Kiro](https://kiro.dev) IDE. Specs get sequential ids (`0001`, `0002`, ...).
- **`postman-collection`** — creates and updates a Postman collection and its Local/Production environments for an HTTP API, from an OpenAPI document or from the route definitions, with bearer auth and auto-login built in.
- **`dotnet-skills`** — configures a **.NET** project to engineering standards (layering, `Contracts/` folders, DI registration, async and logging rules, Central Package Management, structural tests): inspects the project, reports gaps, then writes the standards as a Kiro steering file after your approval. .NET only. Details: [docs/dotnet-skills.md](docs/dotnet-skills.md).
- **`dotnet-db-review`** — reviews the **database design and data-access layer of a .NET backend** (EF Core, Dapper, ADO.NET over PostgreSQL, SQL Server, MySQL, SQLite): schema, keys, types, constraints, indexes, N+1, tracking, DbContext lifetime, transactions, concurrency, raw-SQL safety and migration safety. Static and read-only; reports `file:line` evidence, a reproducible health score and ranked fixes. Details: [docs/dotnet-db-review.md](docs/dotnet-db-review.md).

`kiro-spec-driven` and `postman-collection` work in any language or stack: Node.js, .NET, Python, PHP, Rust, Go, Java, Ruby, or a mix. See [Any language](#any-language).

Independent community project; not an official Anthropic or Kiro product.

## Install

In Claude Code:

```
/plugin marketplace add rj8b0000/art-of-code
/plugin install art-of-code@art-of-code
```

Verify with `/plugin` (Installed tab), or type `/` and look for `/art-of-code:kiro-spec-driven`, `/art-of-code:postman-collection`, `/art-of-code:dotnet-skills` and `/art-of-code:dotnet-db-review`. If the repo is private, each person needs their own GitHub read access (SSH key or HTTPS credential) configured in git.

**Coming from `claude-kiro-spec-driven`?** The repo, marketplace and plugin were renamed to `art-of-code`, and skill commands now start with `/art-of-code:`. An existing install does not update in place:

```
claude plugin uninstall kiro-spec-driven@claude-kiro-spec-driven
claude plugin marketplace remove claude-kiro-spec-driven
claude plugin marketplace add rj8b0000/art-of-code
claude plugin install art-of-code@art-of-code
```

## Use

The skills trigger automatically from the task description, or run them explicitly:

```
/art-of-code:kiro-spec-driven      write a spec for "order cancellation flow"
/art-of-code:postman-collection    create a Postman collection for this API
/art-of-code:dotnet-skills         configure this .NET project to our standards
/art-of-code:dotnet-db-review      review this .NET backend's database design and queries
```

### Spec-driven workflow

```
Project ready? →(approve)→ Requirements →(approve)→ Design →(approve)→ Tasks →(approve)→ Execution
```

Each phase ends with an approval gate. **Phase 0 comes first:** if the folder has no real project yet (no stack marker files or source), the skill asks for the stack, name, folder and database, shows the scaffold commands, and only scaffolds after you approve; `.kiro/` is then created in that project's root. Passwords or tokens in your request are never written into a spec; they go into the stack's untracked local secret store. Output lands in your project:

```
.kiro/specs/<feature>/
  .config.kiro      {"specId": "0001", "workflowType": "requirements-first", "specType": "feature"}
  requirements.md   Introduction, Glossary, Assumptions, Requirements with EARS criteria
  design.md         Overview, Architecture, Components, Data Models, Correctness Properties
  tasks.md          checkbox plan with requirement links and a dependency graph
```

Open the project in Kiro and the spec appears in its specs panel. Details: [docs/kiro-spec-driven.md](docs/kiro-spec-driven.md).

### Postman collections

Creates or updates a collection from an OpenAPI document (via the Postman CLI) or from route definitions, keeping hand-added scripts, removing requests for deleted endpoints, and wiring Bearer `{{accessToken}}` with an auto-login pre-request script. Real credentials are never written to files. Details: [docs/postman-collection.md](docs/postman-collection.md).

## Any language

Neither skill depends on the project's language or on any runtime.

- **Specs** are markdown plus one JSON line, so they are identical for every stack. The skill detects the stack from marker files (`package.json`, `*.csproj`, `pyproject.toml`, `composer.json`, `Cargo.toml`, `go.mod`, `pom.xml`/`build.gradle`, `Gemfile`), uses the project's own build and test commands, and writes design snippets in its language. Sequential spec ids are computed with the agent's file tools, bash or PowerShell; Node is optional. See `references/stack-detection.md` and `references/spec-id.md`.
- **Postman collections** only care about HTTP. The skill finds the contract through each framework's OpenAPI support (ASP.NET, NestJS, Express, Fastify, FastAPI, Django REST framework, Flask, Laravel, Symfony, Spring, Go, Rust, Rails) or reads route declarations when there is no spec. See `references/api-discovery.md`.

## Repository layout

```
.claude-plugin/marketplace.json
plugins/art-of-code/
  .claude-plugin/plugin.json
  skills/kiro-spec-driven/     SKILL.md, templates/, references/ (format, EARS, stack detection, spec id), scripts/next-spec-id.mjs (optional)
  skills/postman-collection/   SKILL.md, references/ (scripts, skeleton collection, conventions, API discovery)
  skills/dotnet-skills/        SKILL.md, templates/dotnet-engineering-standards.md
  skills/dotnet-db-review/     SKILL.md, references/ (discovery, schema design, EF Core, Dapper/ADO.NET, migrations, report template)
docs/                          usage and per-skill guides
```

More: [docs/usage.md](docs/usage.md).

## License

MIT. See [LICENSE](LICENSE).
