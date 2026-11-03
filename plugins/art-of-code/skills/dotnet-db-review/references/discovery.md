# Discovery patterns

Regexes for the Grep tool (ripgrep / Rust regex syntax), scoped to `*.cs`, `*.csproj`, `*.props` and `appsettings*.json`. Exclude `bin/`, `obj/` and, unless reviewing them, `Migrations/` and test projects. Every hit is a lead to read in context, not a finding by itself.

**Pipe note:** inside the tables below, `\|` is only Markdown's escape for a pipe character in a table cell. When you search, use a plain `|` for alternation (for example `Include\(|ThenInclude\(`). Backslash-escape literal dots and parentheses as shown.

## Provider, ORM and versions

| Signal | Pattern | Where |
|---|---|---|
| PostgreSQL | `Npgsql` | `*.csproj`, `Directory.Packages.props` |
| SQL Server | `Microsoft\.EntityFrameworkCore\.SqlServer\|Microsoft\.Data\.SqlClient\|System\.Data\.SqlClient` | same |
| MySQL / MariaDB | `Pomelo\.EntityFrameworkCore\.MySql\|MySql\.EntityFrameworkCore\|MySqlConnector\|MySql\.Data` | same |
| SQLite | `Microsoft\.EntityFrameworkCore\.Sqlite\|Microsoft\.Data\.Sqlite` | same |
| EF Core version | `Microsoft\.EntityFrameworkCore"` with `Version=` | same |
| Dapper | `Dapper` | same |
| Target framework | `<TargetFramework` | `*.csproj` |
| Other migrators | `FluentMigrator\|DbUp\|Flyway\|Evolve` | same |

## DbContext, model and migrations

| Signal | Pattern |
|---|---|
| DbContext classes | `class\s+\w+\s*:\s*(\w+<[^>]+>\|IdentityDbContext\w*\|DbContext)` |
| Entity configuration | `IEntityTypeConfiguration<\|OnModelCreating\|ApplyConfigurationsFromAssembly` |
| Model snapshot | files named `*ModelSnapshot.cs` (use Glob) |
| Migration files | `Migrations/*.cs` (use Glob), `migrationBuilder\.` |
| Design-time factory | `IDesignTimeDbContextFactory<` |
| Migrate at startup | `Database\.Migrate\(\|MigrateAsync\(` |
| Entities exposed | `DbSet<` |

## Registration, lifetime and options

| Signal | Pattern | Why it matters |
|---|---|---|
| Registration | `AddDbContext\b\|AddDbContextPool\|AddDbContextFactory\|AddPooledDbContextFactory` | lifetime and pooling |
| Wrong lifetime | `ServiceLifetime\.Singleton\|static\s+\w*DbContext\|new\s+\w*DbContext\(` | shared or hand-built contexts |
| Provider options | `UseNpgsql\|UseSqlServer\|UseMySql\|UseSqlite` | retry, timeout, version |
| Resilience | `EnableRetryOnFailure\|CreateExecutionStrategy\|CommandTimeout` | retries and transactions |
| Naming convention | `UseSnakeCaseNamingConvention\|ToTable\(\|HasColumnName\(` | naming boundary |
| Lazy loading | `UseLazyLoadingProxies\|ILazyLoader\|virtual\s+(ICollection\|List\|IList)<` | hidden N+1 |
| Tracking default | `QueryTrackingBehavior` | default tracking |
| Query splitting | `UseQuerySplittingBehavior\|AsSplitQuery\|AsSingleQuery` | cartesian explosion |
| Dangerous logging | `EnableSensitiveDataLogging\|EnableDetailedErrors` | data in logs |

## Configuration and secrets (values are never repeated)

| Signal | Pattern | Where |
|---|---|---|
| Connection strings | `ConnectionStrings` | `appsettings*.json`, code |
| Pool settings | `Maximum Pool Size\|Max Pool Size\|Minimum Pool Size\|Pooling\|Connection Lifetime\|Command Timeout\|Timeout=` | connection strings |
| Embedded credentials | `(Password\|Pwd)\s*=` | committed config, code, docs (report key and file:line only) |

## Query surface (EF Core)

| Signal | Pattern |
|---|---|
| Eager loading | `\.Include\(\|\.ThenInclude\(` |
| Tracking off | `AsNoTracking\|AsNoTrackingWithIdentityResolution` |
| Client evaluation | `\.ToList\(\)\s*\.(Where\|Select\|OrderBy\|Count\|Any\|First)\|\.ToListAsync\(\)\)\s*\.(Where\|Select)\|\.AsEnumerable\(\)\s*\.Where` |
| Sync calls | `\.ToList\(\)\|\.First\(\)\|\.FirstOrDefault\(\)\|\.Single\(\)\|\.Count\(\)\|\.SaveChanges\(\)` |
| Blocking | `\.Result\b\|\.Wait\(\)\|GetAwaiter\(\)\.GetResult` |
| Unbounded lists | `ToListAsync\(\)` (then check for `Take`/pagination on the same query) |
| Paging | `\.Skip\(\|\.Take\(` |
| Contains on lists | `\.Contains\(` inside `Where` expressions |
| Bulk ops | `ExecuteUpdate\|ExecuteDelete\|ExecuteSql\|BulkInsert\|AddRange` |
| SaveChanges | `SaveChangesAsync\|SaveChanges\(` (check for use inside loops) |
| Transactions | `BeginTransaction\|TransactionScope\|CreateExecutionStrategy\|IDbContextTransaction` |
| Query filters | `HasQueryFilter\|IgnoreQueryFilters` |
| Concurrency | `IsRowVersion\|IsConcurrencyToken\|\[ConcurrencyCheck\]\|\[Timestamp\]\|xmin\|DbUpdateConcurrencyException` |
| Compiled queries | `EF\.CompileAsyncQuery\|EF\.CompileQuery` |

Query-in-loop (N+1 candidates), multiline:

`foreach\s*\([^)]*\)\s*\{[^}]{0,400}await\s+[\w\.]*(Repository|_repo|_context|_db|DbContext|Query\w*Async|ExecuteAsync)` (run with multiline enabled)

Also check `for`, `while`, `.Select(async`, and `Task.WhenAll` over per-item queries.

## Raw SQL and Dapper / ADO.NET

| Signal | Pattern |
|---|---|
| Injection candidates | `FromSqlRaw\(\$\|ExecuteSqlRaw\(\$\|FromSqlRaw\([^)]*\+\|ExecuteSqlRaw\([^)]*\+\|CommandText\s*=\s*\$\|CommandText\s*=\s*".*"\s*\+\|Query(Async)?<[^>]*>\(\$\|Execute(Async)?\(\$` |
| Safe interpolation | `FromSql\(\$\|ExecuteSql\(\$` (EF 7+ parameterizes these; confirm no identifier interpolation) |
| Dapper calls | `\.Query(Async)?<\|\.QueryFirst\|\.QuerySingle\|\.Execute(Async)?\(\|QueryMultiple` |
| Over-fetching | `SELECT\s+\*` |
| Connections | `new\s+(Npgsql\|Sql\|MySql)Connection\(\|\.OpenAsync\(\|CreateConnection` |
| Disposal | `using\s+var\s+\w*(conn\|cmd\|reader)` and `await\s+using` (absence next to opens is a leak lead) |
| Bulk paths | `COPY\s\|BeginBinaryImport\|SqlBulkCopy` |

## Migrations (quick scan)

| Signal | Pattern |
|---|---|
| Destructive | `DropTable\|DropColumn\|DropForeignKey\|DropIndex\|AlterColumn` |
| Renames | `RenameColumn\|RenameTable` (Drop + Add of the same column name in one migration suggests lost data) |
| Raw SQL | `migrationBuilder\.Sql\(` |
| Missing rollback | `protected override void Down\(MigrationBuilder migrationBuilder\)\s*\{\s*\}` |
| Non-concurrent index | `CreateIndex\(` (Postgres: check for `CONCURRENTLY` via raw SQL and `suppressTransaction`) |
| Seed data | `HasData\(\|InsertData\(` |
| Non-null add | `AddColumn<` with `nullable: false` and no `defaultValue` |
