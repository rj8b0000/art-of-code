---
inclusion: always
---

# .NET engineering standards

Standards to converge toward on this project. Discover whether each one is already in place before adding anything, and treat a gap as something to flag, not something to fix silently as a side effect of unrelated work. When a project already follows a different convention consistently, match it and record the difference rather than mixing two styles.

## Architecture: discover, then preserve

Identify the architecture actually in use before proposing anything new: Clean Architecture (Domain/Application/Infrastructure/Presentation), traditional N-tier, vertical slice, or a single-project app. A `.sln` with several layered `.csproj` files is evidence, not proof; read the real dependencies between projects before naming the pattern. When a genuinely new architectural decision is needed and there is no precedent, present the options and trade-offs and wait for approval before generating anything structural.

## Layering and dependency direction

Enforce a strict, one-directional dependency flow:

```
Presentation (API controllers / web UI)
        |
        v
   Services        (business logic, use-case orchestration)
        |
        v
  Repository        (data access only)
        |
        v
Database / Entity   (persistence model)

Model / Shared / contract interfaces = cross-cutting, referenced by any layer
```

- A controller or UI layer never talks to the database context, an HTTP client, or a third-party SDK directly, only to a service.
- A repository never calls another repository, an HTTP client, or an external SDK, only the database.
- No skipping a layer "just this once". If an existing module already skips layers, flag it as a known gap rather than copying the pattern into new code.

## Interfaces and dependency injection

- Every service and repository interface lives in a `Contracts/` subfolder of the project that defines it; depend on the interface, not the implementation.
- Register implementations through a per-project `AddServices()` / `AddRepositories()` (or equivalently named) extension method, called once from the composition root. Do not scatter `services.AddScoped<...>()` calls across `Program.cs`.
- Constructor injection only. Never inject `IServiceProvider` or another service locator to resolve a dependency at call time, and avoid static singletons for application services.

## Async and cancellation

- Public data-access and integration methods are `async` and accept (and propagate) a `CancellationToken` through the call chain.
- Suffix asynchronous methods with `Async`.
- Never use `.Result`, `.Wait()` or `.GetAwaiter().GetResult()` in service or repository code: it is a sync-over-async deadlock risk, not a shortcut.

## Logging and errors

- Log only through an injected `ILogger<T>`; never `Console.WriteLine` in service or repository code.
- Log exceptions with the exception-object overload (`LogError(ex, "message", args)`), not by interpolating `ex.Message` into the template.
- Throw specific exception types for exceptional conditions; do not use exceptions for ordinary control flow. No swallowed exceptions.

## Code style

- PascalCase for types, methods and public properties; camelCase for locals and parameters; `_camelCase` for private fields.
- Keep nullable reference types enabled where the project already enables them; do not introduce nullable warnings.
- Use file-scoped namespaces in new files, matching the project's C# language version and existing whitespace conventions.

## Packages

- Centralize every package version in `Directory.Packages.props` (Central Package Management). Individual `.csproj` files reference packages with `<PackageReference Include="..." />` and no `Version` attribute.

## Database and API naming boundary

- Keep the API/DTO boundary and the database boundary on their own consistent naming convention each (for example camelCase JSON over a snake_case-configured EF model). Never mix both conventions within one boundary, and never let database column casing leak into the API contract or the reverse.

## Testing and structural enforcement

- Use the test framework and mocking library already in the solution; do not introduce a second one without discussing it first.
- Encode the architectural rules that matter (layering, no inline SDK or HTTP client construction outside its designated factory, mapper purity, append-only audit tables, tenant or scope isolation) as automated structural tests, reflection-based or with a library such as NetArchTest, not only as documentation. A rule without a test behind it will eventually be violated.
- If the project is multi-tenant, thread the tenant or scope key through every service and repository call and enforce it with a property or structural test. Do not assume multi-tenancy without evidence in the project.

## Commands

```bash
dotnet build
dotnet test
dotnet format
```

Use the solution file or project path the repository actually uses.

## Postman collection

For an HTTP API project, keep the Postman collection in sync with the API: generate it from the project's OpenAPI document, and whenever a controller action is added, changed or removed, update the collection in the same unit of work (including deleting requests for removed actions). Use the `postman-collection` skill.

## Definition of done for a module

- [ ] Responsibilities match the target layer; no layer skips.
- [ ] No inline SDK or HTTP client construction in business code, only through its designated factory or abstraction.
- [ ] Mappers are pure and stateless: no injected dependencies, no I/O.
- [ ] Async end to end; no `.Result` / `.Wait()`.
- [ ] `ILogger<T>` used; no swallowed exceptions; no `Console.WriteLine`.
- [ ] Dependencies registered once via the `Add*` extension; interfaces in `Contracts/`.
- [ ] A consistent response envelope at the controller boundary.
- [ ] Build and the affected tests pass, actually run, not assumed.
- [ ] An EF schema change ships with a migration and a synchronized model snapshot.
- [ ] The Postman collection reflects the current controller actions: no missing, duplicated or orphaned requests.
