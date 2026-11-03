# Dapper and raw ADO.NET checklist

Applies to Dapper, `NpgsqlCommand`/`SqlCommand`/`MySqlCommand`, and any hand-written SQL, including SQL used alongside EF Core.

## D1. Parameterization (SQL injection)

- **Look for**: SQL built with `$"..."` interpolation or `+` concatenation containing values; user-controlled table, column or `ORDER BY` fragments.
- **Fix**: parameters (`new { id }`, `@id`, `command.Parameters.Add...`); a whitelist for dynamic identifiers and sort columns; Dapper list expansion (`WHERE id IN @ids`) or `= ANY(@ids)` on Npgsql.
- **Severity**: Critical if external input can reach the fragment; High otherwise.

## D2. Connection, command and reader disposal

- **Look for**: `new NpgsqlConnection/SqlConnection(...)`, `OpenAsync()`, commands and readers without `using` / `await using`; connections stored in fields of long-lived objects; an exception path that skips disposal.
- **Why**: pool exhaustion and leaked connections that only show up under load.
- **Fix**: `await using var conn = ...` scoped to the unit of work, or an injected data source (`NpgsqlDataSource`, `IDbConnection` factory) so pooling and configuration are central.
- **Severity**: High.

## D3. Async, cancellation and timeouts

- **Look for**: synchronous `Query`/`Execute` in async paths; `.Result`/`.Wait()`; Dapper calls without `CommandDefinition` and a `CancellationToken`; no `commandTimeout` for long reports or batch jobs; default 30-second timeouts on heavy queries.
- **Fix**: `QueryAsync(new CommandDefinition(sql, args, cancellationToken: ct))`; explicit timeouts for known-long operations.
- **Severity**: High for blocking on request paths, Medium for missing tokens/timeouts.

## D4. N+1 and per-row commands

- **Look for**: a query or `Execute` inside a loop over results; row-by-row inserts/updates for batches.
- **Fix**: set-based SQL (`WHERE id = ANY(@ids)`, `INSERT ... SELECT`, `UPDATE ... FROM (VALUES ...)`), `QueryMultiple`, multi-mapping with correct `splitOn`; bulk paths (`COPY ... FROM STDIN (FORMAT BINARY)` via `BeginBinaryImport`, `SqlBulkCopy`).
- **Severity**: as in the EF checklist (E1/E8).

## D5. Over-fetching and buffering

- **Look for**: `SELECT *` (breaks on schema change, ships unused columns, defeats covering indexes); `QueryAsync` (buffered) over very large result sets → `buffered: false` or streaming with a reader; no `LIMIT`/`TOP` on list queries; unbounded `Contains`/`IN` lists.
- **Severity**: Medium; High for large unbounded results.

## D6. Transactions across technologies

- **Look for**: `IDbTransaction` created but not passed to every command (`transaction:` argument forgotten); Dapper and EF Core writes on separate connections inside one logical operation (not atomic); transaction open across external calls.
- **Fix**: pass the transaction to every command; share the connection with EF (`context.Database.UseTransactionAsync`/`GetDbConnection()` with the same transaction) or move the whole operation to one technology; outbox for external effects.
- **Severity**: Critical for money, stock or order state; High otherwise.

## D7. Mapping and types

- **Look for**: snake_case columns with no `DefaultTypeMap.MatchNamesWithUnderscores` or aliases (silent unmapped nulls); `DateTime` kind handling against `timestamptz`/`datetimeoffset`; custom type handlers missing for enums, JSON, `DateOnly`; decimals read as `double`; `dynamic` results in business code.
- **Severity**: Medium; High where silent data loss is possible (unmapped columns saved back as defaults).

## D8. Schema knowledge in strings

- Hand-written SQL duplicates table and column names. Check each referenced table/column exists in the reconstructed schema (a typo only fails at runtime), and that queries survive the migrations in scope. Prefer a single location (repository layer) for SQL, not scattered through services/controllers (also a layering violation: data access belongs in the repository layer).
- **Severity**: Medium; High if SQL references objects that no migration creates.

## D9. Idempotency and set-based correctness

- **Look for**: upserts implemented as select-then-insert (race) instead of `INSERT ... ON CONFLICT` (Postgres) / `MERGE` (SQL Server, with care) / `INSERT ... ON DUPLICATE KEY UPDATE` (MySQL); counters updated as read-modify-write.
- **Fix**: single-statement upserts backed by a unique index; atomic updates (`SET x = x + @delta`).
- **Severity**: High; Critical when it protects money, stock or idempotency keys.
