# Migration safety checklist (brief)

A quick safety review of the migrations in scope (the focus, the newest ones, or the PR range), not a replay of the whole history. This skill never runs `dotnet ef`; recommend commands for the user to run.

## M1. Reversibility

- Each migration has a meaningful `Down`. An empty `Down` (or a `Down` that cannot restore dropped data) is a finding. For data-destroying migrations, Medium if a backup/restore plan is documented, High if not.

## M2. Destructive operations

- `DropTable`, `DropColumn`, `AlterColumn` that narrows a type or length, type changes with a lossy conversion, `DeleteData`.
- **Rename detected as drop + add**: EF scaffolds a rename as `DropColumn` + `AddColumn` when it cannot tell; that silently deletes the column's data. Fix by editing to `RenameColumn`/`RenameTable`.
- **Severity**: Critical for data loss on populated tables without a copy step; High when the data is recoverable elsewhere.

## M3. Adding constraints to populated tables

- `AddColumn` with `nullable: false` and no `defaultValue` fails on non-empty tables (or needs a default); a new unique index or FK fails if existing data violates it. Look for a preceding data-fix step.
- **Severity**: High (failed deploy mid-release).

## M4. Blocking operations on large tables

- **PostgreSQL**: `CREATE INDEX` without `CONCURRENTLY` blocks writes. EF has no first-class concurrent index; use `migrationBuilder.Sql("CREATE INDEX CONCURRENTLY ...")` with `suppressTransaction: true`. Adding a column with a volatile default or changing a column type rewrites the table.
- **SQL Server**: index creation without `ONLINE = ON` (Enterprise/Azure) blocks; altering large columns takes locks.
- **MySQL**: choose `ALGORITHM=INPLACE/INSTANT` where supported; check for table-copy operations.
- **Severity**: High on large production tables; Medium otherwise. Table size is unknown from code: state that assumption.

## M5. Snapshot integrity

- The `*ModelSnapshot.cs` matches the latest migration and the current model. Signs of drift: model properties with no corresponding migration; a snapshot edited by hand; two migrations with the same intent; a merged branch that regenerated the snapshot. Ask the user to run `dotnet ef migrations has-pending-model-changes` (EF 8+) or `dotnet ef migrations add Check` on a scratch branch.
- **Severity**: High (the next developer's migration will contain unrelated, possibly destructive changes).

## M6. Data changes inside schema migrations

- `migrationBuilder.Sql(...)` or `InsertData`/`UpdateData` mixing data fixes with schema changes; long-running updates inside a migration transaction. Prefer idempotent, batched data scripts run separately for large tables.
- **Severity**: Medium.

## M7. Applying migrations

- `Database.Migrate()`/`MigrateAsync()` at application startup in a multi-instance or autoscaled deployment: concurrent instances race (EF takes a lock on most providers, but a slow migration blocks startup of every instance and health checks fail). Prefer a migration bundle (`dotnet ef migrations bundle`) or a one-off job in the pipeline.
- Design-time factory containing a real connection string or credentials → secret finding (key and file:line only).
- **Severity**: Medium for startup migration with one instance; High with many instances or large migrations.

## M8. Seed data

- `HasData` for large or changing reference data (every change becomes a migration; keys must be explicit). Seeding at startup that is not idempotent, or that creates default admin credentials → High (credentials finding, never quote the value).

## M9. Ordering and hygiene

- Migrations named for intent; no timestamp collisions across branches; migrations live in the data project (`MigrationsAssembly`) and the snapshot belongs to the same context; no migration depends on application code that can change later.
