# Report template

Write the report in this order. Keep it scannable: tables for inventories, numbered findings for issues. Every finding has evidence (`file:line`), an impact, and a specific fix. Do not include secret values, production hostnames or customer data.

## Severity definitions

| Severity | Meaning |
|---|---|
| Critical | Data loss or corruption, security exposure (SQL injection, cross-tenant data, credentials committed), or a near-certain production failure. |
| High | Significant performance or correctness risk on a hot or common path, missing integrity on important invariants, failed-deploy risk. |
| Medium | Real but bounded cost: rare paths, maintainability, missing safeguards with a workaround. |
| Low | Polish, style, micro-optimization. |

## Schema Health Score

`score = max(0, 100 - (15 x Critical + 8 x High + 3 x Medium + 1 x Low))`, counting each distinct finding once. Print the counts and the arithmetic so the number is reproducible. It is a prioritization aid, not a quality certificate: it says nothing about runtime performance that was not measured.

## Structure

```markdown
## .NET Database Review

**Scope:** {whole data layer | focus given}
**Stack:** {provider(s)} · {EF Core version / Dapper / ADO.NET} · {target framework}
**Migrations:** {count reviewed} · latest snapshot `{path}`
**Method:** static review of code, migrations and configuration; no database access; no queries executed.

### Schema Health Score: {score}/100
({C} Critical x 15 + {H} High x 8 + {M} Medium x 3 + {L} Low x 1 = {penalty})

### Summary
{Three to five sentences: the shape of the schema, the biggest risks, what is solid.}

### Findings by category

| Category | Critical | High | Medium | Low |
|---|---|---|---|---|
| Keys & relationships | | | | |
| Types & constraints | | | | |
| Indexes | | | | |
| Normalization | | | | |
| Query patterns (N+1, tracking, paging) | | | | |
| Concurrency & transactions | | | | |
| DbContext & connections | | | | |
| Raw SQL & security | | | | |
| Migrations | | | | |

### Critical and High findings

1. **DB-001: {title}** · {Critical|High}
   - **Where:** `{file}:{line}` (table `{table}` / column `{column}` / method `{Method}`)
   - **Evidence:** {the code or configuration that shows it, 1-3 lines, secrets redacted}
   - **Impact:** {what goes wrong: data loss, slow queries at which scale, inconsistency, exposure}
   - **Fix:** {the exact change: index definition, column type, query rewrite, configuration, code pattern}
   - **Effort:** S | M | L

### Medium and Low findings

| ID | Severity | Category | Where | Issue | Fix |
|---|---|---|---|---|---|

### Schema inventory

| Table | Key | Notable columns | Indexes | Constraints / FKs | Rows |
|---|---|---|---|---|---|

(Rows are `unknown` unless provided; mark partial inventories as partial.)

### Index coverage

| Query location | Table | Predicate / join / order columns | Matching index | Verdict |
|---|---|---|---|---|

Also list unused and redundant indexes, with the caveat that ad-hoc and BI queries are invisible to code.

### N+1 and query-in-loop

| Location | Parent query | Per-item query | Estimated queries per request | Fix |
|---|---|---|---|---|

### Constraint coverage

| Table | NOT NULL | FKs | Unique | Check | Defaults | Notes |
|---|---|---|---|---|---|---|

### Migration notes

{Only for migrations in scope: reversibility, destructive operations, snapshot drift, blocking operations.}

### What looks good
{Short, specific: patterns worth keeping (for example concurrency tokens on queue rows, idempotency keys, structural tests).}

### Assumptions and unknowns
- {Row counts unknown unless provided; index advice for small tables is conditional.}
- {No query plans available; performance statements are reasoning from the code.}
- {Engine and version assumptions; anything not reviewed and why.}

### Recommendations, ranked by impact
1. {Fix} - resolves {DB-0xx}, effort {S/M/L}
2. ...

### Suggested next steps
- Offer: spec the fixes with `/art-of-code:kiro-spec-driven`; broader convention gaps with `/art-of-code:dotnet-skills`.
- For the user to run on a non-production database: `dotnet ef migrations has-pending-model-changes`, and an execution plan (`EXPLAIN (ANALYZE, BUFFERS)` / SQL Server actual plan) for each query flagged in the index coverage table.
```

## Reporting rules

- One finding per distinct problem; group identical occurrences under one ID with a list of locations.
- Order findings by severity, then by blast radius.
- If a category has no findings, write "none found" rather than omitting it.
- When something could not be verified from code, say so under Assumptions and unknowns instead of asserting it.
