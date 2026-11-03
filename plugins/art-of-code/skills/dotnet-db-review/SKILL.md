---
name: dotnet-db-review
description: Use this skill to review the database design and data-access layer of a .NET backend — EF Core, Dapper or ADO.NET over PostgreSQL, SQL Server, MySQL or SQLite. Trigger on "review the database schema", "review our EF Core code", "find N+1 queries", "missing indexes", "audit the DbContext", "check these migrations", "is this schema design okay", "database design review", "why is this query layer slow". It reconstructs the schema from the EF model and snapshot, then audits normalization, keys and types, constraints, indexes, concurrency, DbContext lifetime, transactions, tracking, raw SQL safety and migration safety, and reports findings with file:line evidence, a deterministic health score and a ranked fix list. Read-only static review: it never connects to a database, runs SQL or migrations, or edits code. .NET relational only; NoSQL stores and non-.NET stacks are out of scope.
---

# .NET database design and data-access review

Audits the schema design and the data-access code of a .NET backend and reports what is wrong, where, why it matters and how to fix it. It is a **static, read-only review**: it reads code, migrations and configuration only. It never connects to a database, runs SQL, applies or generates migrations, or modifies files. Performance statements are reasoning from the code, not measurements, and the report says so.

Checklists live in `references/`: `discovery.md` (search patterns), `schema-design.md`, `efcore-checklist.md`, `dapper-ado-checklist.md`, `migrations.md`, `report-template.md`. Read the ones a phase names before running it.

## Scope and safety

- **In scope**: ASP.NET Core / worker / console backends using EF Core, Dapper or raw ADO.NET against PostgreSQL (Npgsql), SQL Server, MySQL/MariaDB or SQLite.
- **Out of scope**: Cosmos DB, MongoDB, DynamoDB, Firestore and other non-relational stores; non-.NET code. If that is all there is, say so and stop.
- **Input** (optional): a focus such as `orders schema`, `Orders module`, `new migrations`, or a PR range. With no focus, review the whole data layer.
- **Work autonomously.** Investigate the codebase instead of asking questions. Stop and ask only when no .NET data layer exists, or the target is genuinely ambiguous (several solutions, no focus).
- **Secrets**: connection strings, passwords and tokens found in `appsettings*.json`, code or docs are reported as a finding (file:line and key name only). **Never quote or repeat the value** anywhere in the report.
- **Never** run `dotnet ef`, `psql`, `sqlcmd` or any command that touches a database. Reading files and searching them is all this skill does.
- Existing project conventions win over generic advice when they are consistent. Report the difference, do not mix styles.

## Phase 1: Detect the stack

Use `references/discovery.md`. Establish, with file evidence:

1. **Provider(s)**: Npgsql / SqlServer / MySQL (Pomelo or Oracle connector) / SQLite, and the EF Core and .NET versions (they change what advice applies: `ExecuteUpdate/ExecuteDelete` need EF 7+, interpolated `FromSql` EF 7+, `ToJson` EF 7+, `Guid.CreateVersion7` .NET 9+).
2. **Access technologies** in use: EF Core, Dapper, raw ADO.NET, or a mix (a mix on separate connections inside one logical operation is itself a finding).
3. **DbContext(s)**, where they are registered, their lifetime, and the naming convention (for example snake_case).
4. **Migrations**: folder, latest `*ModelSnapshot.cs`, tool, and whether migrations run at startup.
5. **Connection configuration**: pool size, timeouts, retry policy (values only, secrets redacted).

## Phase 2: Reconstruct the schema

The current schema is the **latest model snapshot** plus any entity configuration (`IEntityTypeConfiguration<>`, `OnModelCreating`, data annotations) and hand-written SQL in migrations. Build an inventory:

| Table | Key columns | Columns (type, nullability) | Indexes | Constraints / FKs | Related tables | Rows |

Row counts are **unknown from code**. Write `unknown` unless the user gave numbers or the repo documents them; never invent them. State that index advice for small tables is conditional on actual size.

For a Dapper/ADO.NET-only project, reconstruct from SQL scripts, migration tool files (DbUp, FluentMigrator, Flyway scripts) and the queries themselves, and mark the inventory as partial.

## Phase 3: Schema design review

Follow `references/schema-design.md`: normalization (under and over), primary and foreign keys, data types per provider, constraints (NOT NULL, unique, check, defaults), index coverage derived from the actual queries, concurrency tokens, multi-tenant scoping, soft delete and audit tables, queue/outbox table design, and retention of append-only tables.

Derive index recommendations from real query predicates: for each hot query path, list `Where`/`Join`/`OrderBy`/`GroupBy` columns, compare with the indexes in the snapshot, then report gaps, unused indexes and wrong composite column order. Do not recommend indexes for tables that are clearly tiny lookup tables.

## Phase 4: Data-access review

- **EF Core**: `references/efcore-checklist.md`
- **Dapper / ADO.NET**: `references/dapper-ado-checklist.md`

Covers N+1 and query-in-loop, eager-loading gaps and cartesian explosion, tracking vs `AsNoTracking`, over-fetching and missing projection, client-side evaluation, unbounded and offset pagination, sync-over-async and missing `CancellationToken`, per-entity `SaveChanges` and missing bulk operations, DbContext lifetime and thread safety, transactions (including retry strategy and spans across external calls), optimistic concurrency, raw SQL injection, global query filters, connection pooling and leaks.

## Phase 5: Migration safety (brief)

Follow `references/migrations.md`: reversibility, destructive operations, snapshot drift, blocking operations on large tables, rename-as-drop-and-add, startup `Migrate()` in multi-instance deployments, seed data. This is a quick safety check on the migrations in scope, not a replay of the whole history.

## Phase 6: Self-check, then report

Before writing the report, verify (up to 2 passes; fix what fails, then stop):

1. Every section of `references/report-template.md` is present and non-empty (or explicitly "none found").
2. Every finding cites a real `file:line` that was actually read, and the code or config it relies on.
3. Every fix is specific (the exact index, column type, query change or code change), not "consider optimizing".
4. Every severity is justified by the definitions in the template and the evidence, not by gut feel.
5. No secret value appears anywhere in the report.
6. Claims about runtime behavior are labeled as reasoning from code. Unknowns (row counts, engine version, real query plans) are listed under Assumptions.

Then produce the report in the format of `references/report-template.md`, including the **Schema Health Score**, computed by the formula there so the number is reproducible.

## Do not

- Flag deliberate denormalization without weighing the read pattern it serves.
- Recommend indexes on tables that are tiny by nature, or normalization changes without naming the migration effort.
- Recommend a new index without naming the query it serves and the write cost it adds.
- Flag NoSQL schemas for missing foreign keys, or review non-relational stores at all.
- Review schema without reading the query code that uses it, or query code without the schema.
- Copy secrets, production hostnames or customer data from any file into the report.
- Edit code, create migrations, or run anything against a database. Offer follow-ups instead.

## Follow-ups to offer

After the report, offer (do not start without a yes): `/art-of-code:kiro-spec-driven` to spec the fix work (for example "add missing indexes and constraints"), `/art-of-code:dotnet-skills` for broader .NET layering and convention gaps the review surfaced, and, for the user to run themselves, `dotnet ef migrations has-pending-model-changes` and an `EXPLAIN (ANALYZE, BUFFERS)` / execution plan on the flagged queries against a non-production database.
