---
name: dotnet-skills
description: Use this skill to configure a .NET project (new or existing) to the .NET engineering standards in this plugin — layering and dependency direction, the Contracts folder convention, DI registration via Add*Services()/Add*Repositories() extension methods, Central Package Management, async/cancellation rules, ILogger-only logging, structural-enforcement tests, and a Postman collection kept in sync with the controllers. Trigger on "configure this .NET project", "set up .NET standards", "apply our .NET conventions", "check this .NET solution against the standards", "what's missing in this .NET project". .NET only: it never configures or considers Next.js, JavaScript or any other stack. For a project with no .NET code yet, it first helps scaffold one (with approval). Do NOT use it to write a feature spec (use kiro-spec-driven) or only to create a Postman collection (use postman-collection).
---

# .NET project configuration

Brings a .NET project's architecture, structure and conventions in line with the standards in `templates/dotnet-engineering-standards.md`, by (1) inspecting what is really there, (2) reporting the gaps honestly, and (3) after approval, writing the standards into the project as a Kiro steering file so every later spec and code change follows them. It documents and governs the standard; it **never refactors existing code to match it** unless the user separately asks.

**.NET only.** Do not add, recommend or configure anything for any other technology, even if the repository also has a frontend. If the user wants a non-.NET part configured too, say this skill is out of scope for it and continue with the .NET side only.

## 0. Project readiness (first, always)

Write nothing until a real .NET project exists (`*.sln`, `*.slnx` or `*.csproj` at the working folder or the intended sub-folder).

- **A .NET project exists** → continue to step 1. Its root (where the `.sln`/`.csproj` live) is where `.kiro/` belongs.
- **No .NET project** → follow `${CLAUDE_PLUGIN_ROOT}/skills/kiro-spec-driven/references/project-readiness.md`: ask in one short batch for what is missing (.NET version, project name and folder, database, `git init`), show the exact `dotnet new` commands, wait for approval, scaffold, confirm `dotnet build` passes, then continue.
- **Unclear target** (parent folder with several solutions) → ask which one.
- **Secrets in the request** (database password, tokens): never write them into any file under `.kiro/` or any committed source; use a configuration key and store the value only in `dotnet user-secrets` or a git-ignored settings file, with the user's approval.

## 1. Inspect the project against the standard

Read the real files; record findings as facts with file paths. Never guess.

- **Solution shape**: projects, their references, which architecture is actually in use.
- **Layering**: does a controller or UI layer reference `DbContext`, `HttpClient` or a third-party SDK directly? Does a repository call another repository or make an HTTP call?
- **Contracts folder**: do service and repository interfaces live in a `Contracts/` subfolder, or are interface and implementation mixed together?
- **DI registration**: is there a per-project `AddServices()`/`AddRepositories()` extension, or are registrations scattered across `Program.cs`/`Startup.cs`?
- **Async/cancellation**: any `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` in service or repository code? Do public data and integration methods accept and propagate a `CancellationToken`?
- **Logging and errors**: any `Console.WriteLine` in service or repository code? `ILogger<T>` used consistently? Exceptions logged with the exception overload? Swallowed exceptions?
- **Central Package Management**: does `Directory.Packages.props` exist, and do `.csproj` files omit `Version` attributes?
- **Structural enforcement**: is there a test project asserting these rules (NetArchTest, reflection-based tests), or are they only documented?
- **Naming boundary**: one consistent convention at the API/DTO boundary and a separate consistent one at the database boundary?
- **Style**: nullable reference types, file-scoped namespaces, naming conventions.
- **Tests**: framework and mocking library already in use.
- **API surface**: is this an HTTP API? Is there an OpenAPI document or OpenAPI setup, and a Postman collection?
- **Existing guidance**: `.kiro/steering/`, `CLAUDE.md`, `.editorconfig`. Existing project rules win over the standard where they conflict; list the conflict.

If a needed detail is missing or ambiguous (no architecture to infer from, two competing DI patterns), say so as a gap instead of choosing one.

## 2. Report, then plan

Present to the user, before writing anything:

1. **Findings**: confirmed from code vs. uncertain.
2. **Gaps**: what is missing or inconsistent against the standard, each with its file or project. This is work still to be done in the code; applying the steering file does not bring the project into compliance, so never imply it does.
3. **The one file this skill would write**: `.kiro/steering/dotnet-engineering-standards.md`, from `templates/dotnet-engineering-standards.md`. If that file already exists and differs from the template, show the differences and ask: keep theirs, replace, or merge specific sections. Never overwrite a hand-edited steering file silently.
4. **Questions**, only for what inspection could not answer.

Wait for explicit approval. Silence or a topic change is not approval.

## 3. Apply only what is approved

- Write `.kiro/steering/dotnet-engineering-standards.md` (create `.kiro/steering/` if needed, at the project root from step 0).
- Do not fix gaps in code unless the user asks. For a gap they want fixed, handle it as its own change, with a spec if it is large (`kiro-spec-driven`).
- Report exactly what was written, what was skipped and why, and restate the gap list as the project's remaining work. Never claim a build or test passed unless it was actually run.

## 4. Postman collection (HTTP API projects)

If the project exposes an HTTP API, offer the `postman-collection` skill in this plugin: it generates the collection from the OpenAPI document (adding minimal OpenAPI middleware first only with approval when none exists) and keeps it in sync. For an existing project where controllers changed in this session, update the collection in the same turn as the controller change, not as a later follow-up, and delete requests for removed actions. If the Postman CLI is not installed, flag it as a gap rather than skipping silently.
