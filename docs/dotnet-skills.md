# Skill: dotnet-skills

Configures a **.NET** project to a set of engineering standards: inspect what is really there, report the gaps, then (after approval) write the standards into the project as a Kiro steering file. It is .NET only and never touches any other stack.

## Flow

```
0 Project ready? → 1 Inspect → 2 Report gaps + plan (approve) → 3 Write steering file → 4 Postman (API projects)
```

0. **Project readiness.** Nothing is written until a real .NET project exists (`*.sln`, `*.slnx` or `*.csproj`). If there is none, the skill asks for the .NET version, project name and folder, database and `git init`, shows the `dotnet new` commands, scaffolds only after approval, and confirms `dotnet build` passes. Secrets in your request (for example a database password) never go into `.kiro/` files or committed source; they go into `dotnet user-secrets` or a git-ignored settings file, with approval.
1. **Inspect.** Layering, `Contracts/` folders, DI registration, async and cancellation, logging, Central Package Management, structural tests, API/database naming boundary, style, test tooling, and whether the project is an HTTP API with OpenAPI and a Postman collection.
2. **Report and plan.** Findings (confirmed vs. uncertain), the gap list with file paths, and the one file it would write. An existing, different steering file is never overwritten silently.
3. **Write.** `.kiro/steering/dotnet-engineering-standards.md` at the project root, with `inclusion: always` so Kiro and the spec skill follow it. Gaps in code are not fixed unless you ask.
4. **Postman.** For HTTP APIs it offers the `postman-collection` skill to generate and keep the collection in sync.

## The standards

Layering and dependency direction, interfaces in `Contracts/`, DI registered through `Add*` extension methods, constructor injection only, async with `CancellationToken`, no sync-over-async, `ILogger<T>` only, Central Package Management, consistent API and database naming boundaries, structural enforcement tests, a definition of done for a module, and Postman collection upkeep. Full text: `plugins/art-of-code/skills/dotnet-skills/templates/dotnet-engineering-standards.md`.

## What it does not do

- It does not refactor your code to match the standard; the gap list is the remaining work.
- It does not configure Next.js, JavaScript or any other stack.
- It does not write feature specs (use `kiro-spec-driven`) or only create collections (use `postman-collection`).
