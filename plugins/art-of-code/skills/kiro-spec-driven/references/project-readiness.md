# Phase 0: project readiness

A spec belongs to a project. Before writing anything under `.kiro/`, make sure there is a real project for it to live in. Writing `.kiro/` into an arbitrary folder (an empty directory, a parent of several projects, the user's home) is the failure this phase prevents.

## 1. Is there a project?

Look in the folder the user is working in (and, for a monorepo, the part being changed) for:

- **Stack marker files**: `package.json`, `*.sln` / `*.slnx` / `*.csproj`, `pyproject.toml` / `requirements.txt`, `composer.json`, `Cargo.toml`, `go.mod`, `pom.xml` / `build.gradle(.kts)`, `Gemfile`, `Makefile`.
- **Source files** in the language the request implies.
- **A git repository** (`.git`).

A folder containing nothing but `.kiro/`, or only unrelated files, is **not** a project. If the folder holds several unrelated projects, or the user's intended target is unclear, ask which one.

## 2. If there is no project, ask first, write nothing

Ask only what is missing, in one short batch:

- **Stack and version** (for example ".NET 10 Web API", "Node 22 + Express", "FastAPI on Python 3.12"), unless the request already states it.
- **Project name and folder** (a new subfolder of the current directory, or the current directory itself if it is empty and intended for this).
- **Database / key dependencies** the request names (for example PostgreSQL), and the ORM or data library if the stack has several common choices.
- **Git**: `git init` yes or no.
- **Scaffold now or spec first?** Default is scaffold first, so the design can inspect a real project. If the user prefers, write the spec first and make "scaffold the project" Task 1 in `tasks.md`.

Then show the exact commands you will run and wait for approval. Never scaffold, install packages, or run generators without it.

## 3. Scaffold

Use the ecosystem's standard generator, confirm the SDK or runtime is installed first (`dotnet --version`, `node --version`, ...), and keep it minimal: the bare project the spec needs, nothing speculative. Typical generators (confirm in the user's environment):

| Stack | Typical scaffold |
|---|---|
| .NET Web API | `dotnet new sln -n <Name>` then `dotnet new webapi -n <Name>.Api -o <Name>.Api` and `dotnet sln add ...` |
| Node.js / TypeScript | `npm init -y` plus the framework's starter (Express, NestJS `nest new`, Fastify), `tsc --init` if TypeScript |
| Python | `python -m venv .venv`, `pyproject.toml`, framework starter (FastAPI, Django `django-admin startproject`, Flask) |
| PHP | `composer create-project laravel/laravel <name>` (or Symfony `symfony new`) |
| Rust | `cargo new <name>` (`--lib` for a library) |
| Go | `go mod init <module>` plus a `main.go` skeleton |
| Java / Kotlin | Spring Initializr, `mvn archetype:generate`, or `gradle init` |
| Ruby | `rails new <name>` or `bundle init` |

After scaffolding, confirm it builds (the project's own build command) and report the result honestly. Then `.kiro/` goes in **that project's root**, next to its marker files, never in the parent folder.

## 3b. Spec-first (only when the user asks for it)

Skip scaffolding, create `.kiro/` in the folder the user confirmed is the intended project root, and make the first task in `tasks.md`: "Scaffold the project (stack, name, build verified)", with the exact commands listed in its details.

## 4. Secrets and credentials in the request

If the request contains a password, token, connection string or key:

- **Never write the value into any file under `.kiro/`** (requirements, design, tasks, steering) or into source files that are committed.
- Refer to it by configuration key (for example `ConnectionStrings:Default`, `DATABASE_URL`, `DB_PASSWORD`).
- Store the value only in the stack's local, untracked secret store, and only with the user's approval:

| Stack | Local secret store |
|---|---|
| .NET | `dotnet user-secrets` (initialize with `dotnet user-secrets init`), or an untracked `appsettings.Development.json` listed in `.gitignore` |
| Node.js / Ruby / PHP / Python / Go | `.env` listed in `.gitignore`, with a committed `.env.example` holding placeholders only |
| Java / Spring | `application-local.properties` or environment variables, untracked |
| Rust | `.env` (untracked) or environment variables |

- Make sure `.gitignore` covers the secret file before creating it.
- Say in the reply where the value went and that it is not in the spec. A password typed into a chat prompt should be treated as a development-only credential and changed before any real use.
