# EF Core data-access checklist

Read the code at each hit before flagging. Each item: what to look for, why it matters, the fix, and a default severity (adjust to evidence and say why). Check the EF Core version first; some fixes need EF 7+ or 8+.

## E1. N+1 and query-in-loop

- **Look for**: `foreach`/`for`/`while`/`.Select(async ...)` bodies that `await` a repository or context query per item; `Task.WhenAll` over per-item queries; navigation properties read after the parent was loaded without `Include` (silent extra queries with lazy loading proxies); loops calling a repository method that itself queries.
- **Why**: one query per row; latency and connection load grow linearly with data.
- **Fix**: load the set once with `Where(x => ids.Contains(x.Id))`, `Include/ThenInclude`, or a projection with `Select`; group in memory. For batch lookups pass a list, not N calls.
- **Severity**: Critical on a request or high-frequency job path, High on common paths, Medium on rare admin paths. State the estimated query count (for example "1 + N per page of 50").

## E2. Eager loading and cartesian explosion

- **Look for**: two or more collection `Include`s in one query without `AsSplitQuery()` (or a global `UseQuerySplittingBehavior`); `Include` of large graphs when a projection would do; `Include` followed by a filter on the included set (`Where` after the fact is applied in memory unless using filtered include).
- **Why**: a single wide query multiplies rows (orders × items × shipments) and ships duplicated data.
- **Fix**: `AsSplitQuery()` for multi-collection includes, or project only the needed columns; filtered `Include(x => x.Items.Where(...))`.
- **Severity**: High on hot paths with large collections, otherwise Medium.

## E3. Tracking and over-fetching

- **Look for**: read-only queries without `AsNoTracking()` (and no global `QueryTrackingBehavior.NoTracking`); returning tracked entities from list endpoints; loading whole entities to read two columns; `SELECT *`-equivalent graphs.
- **Why**: change-tracker memory and CPU, and accidental updates on read paths.
- **Fix**: `AsNoTracking()` (or `AsNoTrackingWithIdentityResolution()`), `Select(x => new Dto { ... })` projections for read models.
- **Severity**: Medium; High for list endpoints returning thousands of rows.

## E4. Client-side evaluation and materialize-then-filter

- **Look for**: `ToList()`/`ToListAsync()`/`AsEnumerable()` followed by `Where/OrderBy/Count/Select`; custom C# methods inside `Where` (EF 3.0+ throws, older versions evaluated client-side); `Count()` on a materialized list; `.Count() > 0` instead of `.Any()`; `ToList().Any()`.
- **Why**: the whole table (or the whole prior result) is pulled into memory before filtering.
- **Fix**: keep the whole query as `IQueryable` until the final materialization; `AnyAsync`, `CountAsync`.
- **Severity**: High on large tables, Medium otherwise.

## E5. Pagination and unbounded results

- **Look for**: list endpoints and repository methods returning `ToListAsync()` with no `Take`; `Skip/Take` without a deterministic `OrderBy`; deep offset pagination on large tables; `Take` without an index supporting the order.
- **Why**: memory blow-ups, inconsistent pages, offset scans that get slower with depth.
- **Fix**: cap and require page size; stable ordering including a unique tiebreaker; keyset pagination (`Where(x => x.Id > lastId).OrderBy(x => x.Id).Take(n)`) for large or hot tables.
- **Severity**: High for unbounded results on growing tables, Medium otherwise.

## E6. `Contains` with large lists

- **Look for**: `ids.Contains(x.Id)` where the list can be large (SQL Server parameter limit about 2,100; PostgreSQL 32,767; large `IN` lists produce poor plans and cache churn).
- **Fix**: batch the list (chunks of a few hundred to a couple thousand), join against a table-valued/temporary set, or use provider-specific array/`ANY` translation (Npgsql translates `Contains` on arrays to `= ANY(...)`).
- **Severity**: Medium; High where failure is possible (parameter limit).

## E7. Async, cancellation and blocking

- **Look for**: synchronous `ToList()`, `First()`, `Count()`, `SaveChanges()` in async request paths; `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` in the data layer; async methods that accept but do not pass a `CancellationToken` to EF calls.
- **Why**: thread-pool starvation under load; abandoned requests keep running queries.
- **Fix**: `ToListAsync(ct)`, `SaveChangesAsync(ct)` throughout; thread the token from the controller.
- **Severity**: High for blocking calls on request paths, Medium for missing tokens.

## E8. SaveChanges patterns and bulk operations

- **Look for**: `SaveChangesAsync` inside loops (one round trip per entity); load-modify-save to apply the same change to many rows; per-row deletes; `AddRange` replaced by per-item `Add` plus save.
- **Fix**: one `SaveChangesAsync` per unit of work; `ExecuteUpdateAsync`/`ExecuteDeleteAsync` (EF 7+) for set-based changes; for very large inserts, provider bulk paths (Npgsql binary `COPY`, `SqlBulkCopy`) or an extension library.
- **Severity**: High on hot or large paths, otherwise Medium.

## E9. DbContext lifetime and thread safety

- **Look for**: singleton or `static` DbContext; a DbContext injected into a singleton or hosted service/Quartz job without a scope or `IDbContextFactory<>`; one context shared across `Task.WhenAll`/`Parallel` (EF Core contexts are not thread-safe); contexts created with `new` in business code; long-lived contexts whose tracker grows; Blazor Server components holding a scoped context for the whole circuit (use a factory).
- **Fix**: scoped registration for requests; `IDbContextFactory<T>` (or `AddPooledDbContextFactory`) for background work, Blazor Server and parallel work; one context per unit of work.
- **Severity**: Critical for shared-across-threads usage (data corruption, `InvalidOperationException` at random), High for singleton/leaky lifetimes.

## E10. Transactions and retries

- **Look for**: multi-step writes across several `SaveChanges` with no transaction; a transaction held open across an HTTP call, message-queue publish or other slow I/O; `EnableRetryOnFailure()` combined with user-started transactions without `CreateExecutionStrategy().ExecuteAsync(...)` (throws); `TransactionScope` without `TransactionScopeAsyncFlowOption.Enabled` in async code; non-default isolation chosen without a reason; manual connections and EF contexts mixed in one logical operation on different connections (not atomic).
- **Fix**: wrap related writes in one transaction via the execution strategy; do external I/O outside the transaction; use an **outbox** (write the message in the same transaction, publish from a worker) instead of "save then publish".
- **Severity**: Critical when atomicity protects money, stock or order state; High otherwise.

## E11. Optimistic concurrency and claim patterns

- **Look for**: read-modify-write on contested rows (queue items, counters, stock, payment state) without a concurrency token; "claim" logic implemented as `select then update` in two steps; swallowed or unhandled `DbUpdateConcurrencyException`.
- **Fix**: concurrency token (`IsRowVersion()` on SQL Server; Npgsql `xmin` mapping or an explicit version column; `[ConcurrencyCheck]`), or one atomic statement (`ExecuteUpdateAsync` with a status predicate and check rows affected; raw `UPDATE ... WHERE ... RETURNING`; `FOR UPDATE SKIP LOCKED` for queues); handle the exception with a defined retry or conflict response.
- **Severity**: High; Critical for money or stock.

## E12. Raw SQL safety

- **Look for**: `FromSqlRaw`/`ExecuteSqlRaw` with `$"..."` interpolation or `+` concatenation (SQL injection); user input in table, column or `ORDER BY` fragments; `FromSql`/`ExecuteSql` (EF 7+) with an interpolated string is parameterized, but interpolating identifiers is still unsafe.
- **Fix**: `FromSql($"... {param}")`, explicit `SqlParameter`s, and a whitelist for dynamic identifiers and sort columns.
- **Severity**: Critical when input can reach the fragment from outside; High otherwise. Concatenation confined to tests is Low, but note it.

## E13. Global query filters and tenant scoping

- **Look for**: `HasQueryFilter` for soft delete or tenant; `IgnoreQueryFilters()` call sites (each needs a reason); multi-tenant repositories whose methods take no tenant key, or controllers that accept a tenant id from the client instead of the caller's claims.
- **Fix**: global filter or mandatory scope parameter plus a structural test; audit each `IgnoreQueryFilters`.
- **Severity**: Critical for cross-tenant exposure; Medium for missing soft-delete filters.

## E14. Model configuration gaps

Cross-check entity configuration and the snapshot: decimal precision, string lengths, required properties, delete behavior, indexes, enum conversions, UTC handling, value converters, owned and JSON types. Details and severities are in `schema-design.md`; report each against the configuration file and line.

## E15. Pooling, connections and options

- **Look for**: `AddDbContextPool` on a context with injected per-request state (pooled contexts must be stateless); missing or extreme `Maximum Pool Size`, timeouts, `CommandTimeout`; connections opened manually and not disposed; `EnableSensitiveDataLogging()`/`EnableDetailedErrors()` outside development; a global default of `Database.Migrate()` at startup in a multi-instance deployment (see `migrations.md`); `UseLazyLoadingProxies` enabled globally.
- **Why**: pool exhaustion under load, leaked connections, data in logs, hidden N+1.
- **Fix**: size the pool against expected concurrency and the database's `max_connections`; use `await using`; gate sensitive logging by environment.
- **Severity**: High for leaks or sensitive logging in production configuration; Medium otherwise.

## E16. Hot-path micro-optimizations (Low)

`EF.CompileAsyncQuery` for very hot, simple queries; avoiding repeated `Include` of large graphs; caching of immutable reference data. Only suggest these after correctness and N+1 issues, and never as a High.
