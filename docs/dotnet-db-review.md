# Skill: dotnet-db-review

Reviews the **database design and data-access layer of a .NET backend** and reports findings with `file:line` evidence, a reproducible health score and a ranked fix list.

It is a **static, read-only review**. It reads code, migrations and configuration. It never connects to a database, runs SQL or `dotnet ef`, or edits files, and performance statements are reasoning from the code, not measurements.

## Scope

- **In**: ASP.NET Core / worker / console backends using EF Core, Dapper or raw ADO.NET over PostgreSQL (Npgsql), SQL Server, MySQL/MariaDB or SQLite.
- **Out**: Cosmos DB, MongoDB, DynamoDB, Firestore and other non-relational stores; non-.NET code.
- **Input** (optional): a focus such as `orders schema`, `Orders module`, `new migrations`, or a PR range. Without one, the whole data layer is reviewed.

## Phases

1. **Detect the stack**: provider, EF Core / .NET versions, access technologies (EF, Dapper, ADO.NET, or a mix), DbContexts and their lifetime, migrations, connection configuration.
2. **Reconstruct the schema** from the latest model snapshot plus entity configuration. Row counts are `unknown` unless you provide them.
3. **Schema design review**: keys, foreign keys and delete behavior, data types per provider, constraints and defaults, index coverage derived from the real queries, normalization, concurrency tokens and queue/outbox tables, tenant scoping, soft delete and audit tables.
4. **Data-access review**: N+1 and query-in-loop, eager loading and cartesian explosion, tracking, over-fetching and client-side evaluation, pagination, `Contains` limits, async and cancellation, per-entity `SaveChanges` and bulk operations, DbContext lifetime and thread safety, transactions and retry strategy, optimistic concurrency and claim patterns, raw-SQL injection, global query filters, pooling and connection leaks. Dapper/ADO.NET get their own checklist.
5. **Migration safety** (brief): reversibility, destructive operations, rename-as-drop-and-add, constraints on populated tables, blocking operations on large tables, snapshot drift, `Migrate()` at startup, seed data.
6. **Self-check and report**: completeness, evidence, specific fixes, justified severities, no secrets; then the report.

## The report

- Stack, scope and method; **Schema Health Score** `max(0, 100 - (15 x Critical + 8 x High + 3 x Medium + 1 x Low))` with the arithmetic shown.
- Findings by category and severity; numbered Critical/High findings with location, evidence, impact, fix and effort.
- Schema inventory, index coverage table, N+1 report, constraint coverage, migration notes.
- What looks good, assumptions and unknowns, and ranked recommendations.

Severity: **Critical** (data loss, security exposure, near-certain production failure), **High** (significant risk on a hot or common path, missing integrity on key invariants), **Medium** (bounded cost), **Low** (polish).

## Safety

- Credentials, connection strings and tokens found in files are reported as findings by **file, line and key name only**; their values are never repeated.
- No recommendation without evidence: new indexes name the query they serve and the write cost they add; tiny lookup tables are not indexed on principle.
- Existing project conventions win over generic advice when they are consistent.

## Related skills

- `kiro-spec-driven` to spec the fix work (for example "add missing indexes and constraints").
- `dotnet-skills` for broader .NET layering and convention gaps the review surfaces.
- Reference files: `plugins/art-of-code/skills/dotnet-db-review/references/` (`discovery.md`, `schema-design.md`, `efcore-checklist.md`, `dapper-ado-checklist.md`, `migrations.md`, `report-template.md`).
