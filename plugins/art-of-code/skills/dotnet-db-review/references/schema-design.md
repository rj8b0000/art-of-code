# Schema design checklist (relational, .NET)

Review the schema as the EF model snapshot and configuration describe it, weighed against how the code actually queries it. Each item states what to look for, why it matters, and the usual fix. Default severities are starting points; adjust to the evidence and say why.

## 1. Keys

- **Every table has a primary key**; keyless entities are deliberate (views, query types) and documented.
- **Key type**: `int` keys on tables that can pass ~2 billion rows (event, audit, queue, log tables) → `long`/`bigint`. Mixed key strategies (some `Guid`, some `int`) without a reason → Low/Medium.
- **Random GUID clustered keys** (SQL Server): fragmentation and page splits → `NEWSEQUENTIALID()`, `Guid.CreateVersion7()` (.NET 9+) or a sequential generator. PostgreSQL does not cluster on the PK, so this matters far less there.
- **Composite keys** on junction tables are fine; check the join table has the second-direction index when both directions are queried.
- **Natural keys** exposed as PK (email, SKU) that can change → surrogate key plus a unique constraint.

## 2. Foreign keys and delete behavior

- Columns named `*_id` / `*Id` that reference another table but have **no FK** (check `HasOne/WithMany`, `[ForeignKey]`, snapshot `b.HasOne`). Orphaned rows accumulate without referential integrity. Exception: deliberate cross-service or external ids (Shopify id, ERP id), which should be named and documented as external.
- **FK columns are indexed.** EF creates FK indexes by convention, but hand-written migrations, raw SQL and `HasIndex` removals can drop them. Unindexed FKs make joins and cascading deletes scan.
- **`OnDelete`**: required relationships default to `Cascade`. Check it is intentional; accidental cascades can mass-delete (orders → items → shipments) and can create multiple cascade paths on SQL Server. Prefer `Restrict`/`NoAction` for business data, `Cascade` only for owned children.
- Optional relationships should be `SetNull` or `Restrict` deliberately, not by accident.

## 3. Data types (by provider)

| Concern | PostgreSQL (Npgsql) | SQL Server | MySQL |
|---|---|---|---|
| Money | `numeric(p,s)` via `HasPrecision` | `decimal(p,s)` | `decimal(p,s)` |
| Timestamps | `timestamp with time zone`, UTC | `datetimeoffset` or `datetime2` (UTC) | `datetime(6)` UTC |
| Text | `text`, or `varchar(n)` only with a real limit | `nvarchar(n)`; avoid unbounded `nvarchar(max)` on indexed or filtered columns | `varchar(n)` / `text` |
| Boolean | `boolean` | `bit` | `tinyint(1)` / `bool` |
| Unique id | `uuid` | `uniqueidentifier` | `char(36)` / `binary(16)` |
| JSON | `jsonb` (not `json`) | `nvarchar(max)` + `ISJSON`, or JSON type (2025) | `json` |
| Enum | check constraint or lookup; EF `HasConversion<string>()` for readability | same | same |

Flag:

- **`float`/`double` for money or quantities that must be exact** → `decimal` with explicit precision. **Missing `HasPrecision`/`HasColumnType` on `decimal` properties**: EF warns and the default may truncate (SQL Server `decimal(18,2)`).
- **Unbounded strings**: no `HasMaxLength`/`[MaxLength]` → `nvarchar(max)`/`text`, which cannot be indexed efficiently on SQL Server. Needed on every indexed or filtered string. Arbitrary small limits (`varchar(50)` for names) that will truncate or fail → raise or use `text`.
- **`DateTime` without a clear UTC convention**: prefer `DateTimeOffset` or enforce UTC via a value converter. On Npgsql, `DateTime` with `Kind=Unspecified/Local` into `timestamptz` throws or shifts; check `Npgsql.EnableLegacyTimestampBehavior` usage and treat it as debt.
- **Integers as booleans** (0/1), nullable booleans (three-state logic is almost always a bug).
- **Enums stored as `int`** without documentation: reordering the enum silently changes meaning → store as string or pin the values explicitly.
- **JSON columns** queried by nested keys or used for structured data with query needs → columns or tables; `jsonb` on PostgreSQL with GIN index when queried; EF `ToJson()` owned types (EF 7+) acceptable for aggregate-shaped data.
- **Comma-separated or delimited values in a column** (for example a `discount_codes` list) that are filtered or joined on → junction table, array, or `jsonb`; if only displayed, Low.

## 4. Constraints and defaults

- **NOT NULL**: C# non-nullable reference types map to NOT NULL only with nullable reference types enabled or `IsRequired()`. Check `created_at`, `status`, foreign keys, and natural identifiers are required. Application null-checks standing in for DB constraints → flag.
- **Unique**: business-unique columns (email, username, slug, external id, order number, idempotency or webhook id) need a unique index. Compound uniqueness (`tenant_id` + `order_no`, `partner_id` + `webhook_id`) is the usual form in multi-tenant systems. Duplicate-prevention done only in application code → High when it protects money, orders or idempotency.
- **Check constraints** (`HasCheckConstraint`) for known ranges: non-negative amounts and quantities, percentages 0–100, status values. Absent and relied on only by validators → Medium.
- **Defaults**: `created_at`/`updated_at` defaults (`HasDefaultValueSql("now()")` / `GETUTCDATE()`), status initial value, booleans defaulting to false. Database defaults matter for raw SQL and other writers.
- **Concurrency token** on contested rows (see section 7).

## 5. Index coverage (derived from queries)

Build a table: query location → table → predicate/join/order columns → existing index → verdict.

- **Missing**: hot-path queries filtering, joining or ordering on unindexed columns. Say how hot (request path, polling job every N seconds, admin report) and what table size is assumed.
- **Composite column order**: equality columns first, then range, then sort; the leftmost column must appear in the query's predicate. A composite whose first column is never filtered on is dead weight.
- **Covering indexes**: `INCLUDE` (PostgreSQL 11+, SQL Server) for frequent narrow reads that otherwise hit the heap.
- **Partial/filtered indexes** (`HasFilter`) for skewed columns and queue patterns: `WHERE status = 'Pending'` on a table that is mostly `Processed`.
- **Redundant indexes**: an index that is a strict prefix of another. **Unused indexes**: no query in the code touches them; note that ad-hoc and BI queries cannot be seen from code.
- **Sort and pagination**: `OrderBy` + `Take` without a supporting index sorts the whole table.
- **Text search**: `LIKE '%term%'`, `Contains` on strings (cannot use a B-tree) → full-text search, `pg_trgm` GIN, or SQL Server full-text.
- **Write cost**: each recommended index names the query it serves and the write overhead it adds; skip indexes on tiny tables or write-heavy, rarely-read tables.

## 6. Normalization

- **Under-normalized**: the same fact stored in several tables with no source of truth (a copied customer name on an order is fine as a snapshot when meant to be historical; flag it when it is meant to stay in sync). Repeated column groups (`phone1`, `phone2`) → child table.
- **Over-normalized**: static lookup tables of 2–3 values joined everywhere → enum plus check constraint; 1:1 tables always loaded together with no reason to split.
- **Third normal form**: a non-key column that depends on another non-key column, or partial-key dependencies in composite-key tables. Report the dependency chain and the fix.
- Deliberate denormalization (snapshots, read models, price at purchase) is acceptable when it matches the read or audit pattern; state that and do not flag it.

## 7. Concurrency and queue-style tables

- Rows that are claimed, decremented or updated by multiple workers (queue items, inventory, counters, sequences, payment state) need **optimistic concurrency** (`IsRowVersion()` on SQL Server, Npgsql `xmin` concurrency token or an explicit version column, `[ConcurrencyCheck]`) or **atomic SQL** (`UPDATE ... WHERE status = 'Pending'`, `FOR UPDATE SKIP LOCKED`). Read-modify-write through EF without either loses updates → High, Critical when money or stock is involved.
- **Queue/outbox tables**: status as a bounded set, attempt count, `locked_until`/claimed-at, last error, dead-letter state, an index that serves "next pending item" (partial on pending), and retention or archival so the table does not grow without bound.
- **Idempotency**: unique key on the external event id (webhook id) so retries cannot create duplicates.

## 8. Tenancy, soft delete, audit

- **Multi-tenant** (a `PartnerId`, `TenantId`, `OrgId` on rows): the scope key is on every tenant-owned table, part of the relevant unique indexes, enforced by a global query filter or consistently threaded through repositories, and covered by a test. A tenant table without the key, or queries that skip it → Critical (cross-tenant data exposure). Do not assume multi-tenancy without evidence.
- **Soft delete**: `IsDeleted`/`DeletedAt` with a global query filter; unique indexes must account for deleted rows (filtered unique index). `IgnoreQueryFilters()` call sites reviewed.
- **Audit tables**: append-only, no update/delete paths, indexed on the lookup key and time, with a retention policy; very large append-only tables → consider partitioning or archival (Medium).
- **Created/modified tracking** columns populated consistently (interceptor or `SaveChanges` override), not by hand at call sites.

## 9. Evidence rule

Every schema finding names the table and column, the file and line that defines it (entity, configuration or snapshot), and, for index findings, the query location that motivates it.
