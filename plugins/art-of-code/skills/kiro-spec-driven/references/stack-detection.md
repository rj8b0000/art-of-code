# Working in any language or stack

The spec format (`.kiro/specs/`, EARS requirements, design, tasks) is plain markdown plus one JSON line, so it is identical for every language. Only two things depend on the stack: how to find the project's own build and test commands, and what to name things in the design. Always read the project's real files; this table says where to look, it is not a substitute for looking.

## Find the build and test commands

| Ecosystem | Marker files | Typical commands (confirm in the project) |
|---|---|---|
| Node.js / TypeScript | `package.json` (`scripts`), lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) | `npm test`, `pnpm test`, `npm run build` |
| .NET / C# | `*.sln`, `*.slnx`, `*.csproj`, `Directory.Packages.props`, `global.json` | `dotnet build`, `dotnet test` |
| Python | `pyproject.toml`, `requirements.txt`, `setup.cfg`, `tox.ini` | `pytest`, `python -m unittest`, `tox` |
| PHP | `composer.json`, `phpunit.xml` | `composer test`, `vendor/bin/phpunit`, `php artisan test` |
| Rust | `Cargo.toml` | `cargo build`, `cargo test` |
| Go | `go.mod` | `go build ./...`, `go test ./...` |
| Java / Kotlin | `pom.xml`, `build.gradle(.kts)` | `mvn test`, `./gradlew test` |
| Ruby | `Gemfile`, `Rakefile` | `bundle exec rspec`, `rake test` |
| Other | `Makefile`, `justfile`, CI config (`.github/workflows/*`, `azure-pipelines.yml`) | whatever CI runs is the authoritative command |

When a README, `CLAUDE.md`, steering file or CI config states the commands, those win over this table.

## What to inspect in the design phase

- Layout and layering: folders or projects, dependency direction, where routes/handlers, business logic and data access live.
- Conventions: naming, error handling, logging, configuration, dependency injection (or its equivalent), test layout and framework.
- Existing similar features: how they are structured end to end, then match them.

## Test and property-test tooling (examples)

Use the framework already in the project. If a design has Correctness Properties and the project has no property-based library, say so rather than adding one silently.

| Ecosystem | Unit tests | Property-based tests |
|---|---|---|
| Node.js / TypeScript | Jest, Vitest, Mocha | fast-check |
| .NET | xUnit, NUnit, MSTest | FsCheck, CsCheck |
| Python | pytest, unittest | Hypothesis |
| PHP | PHPUnit, Pest | Eris |
| Rust | built-in `#[test]` | proptest, quickcheck |
| Go | `testing` | `testing/quick`, rapid, gopter |
| Java / Kotlin | JUnit, Kotest | jqwik, Kotest property |
| Ruby | RSpec, Minitest | rantly |

## Rules

- Write design snippets (interfaces, signatures, data models) in the project's own language, not pseudocode, unless the language is still undecided.
- Never assume a stack. If markers conflict or are missing (new empty repo, polyglot monorepo), record that under Assumptions and Open Questions and ask.
- For a monorepo, scope the spec to the part being changed and name that part in the Introduction.
- A spec's `.kiro/` folder lives at the repository root the user opens in Kiro, regardless of language.
