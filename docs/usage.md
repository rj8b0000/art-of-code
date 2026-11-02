# Usage guide

## 1. Install the plugin

```
/plugin marketplace add rj8b0000/claude-kiro-spec-driven
/plugin install kiro-spec-driven@claude-kiro-spec-driven
```

One step instead of two: `/plugin install kiro-spec-driven --marketplace rj8b0000/claude-kiro-spec-driven`.

Shell equivalents: `claude plugin marketplace add rj8b0000/claude-kiro-spec-driven`, then `claude plugin install kiro-spec-driven@claude-kiro-spec-driven`. List what is installed with `claude plugin list`.

Once installed, the skills are available in every project you open in Claude Code.

## 2. Write your first spec

In any project, ask for a spec in plain words ("write a spec for adding invoice export") or run `/kiro-spec-driven:kiro-spec-driven`. Claude will:

1. Check that the folder holds a real project. If it doesn't, ask you for the stack, name, folder and database, show the scaffold commands, and scaffold only after you approve. `.kiro/` is created in that project's root. Passwords in your prompt are never written into the spec.
2. Pick a kebab-case feature name and check `.kiro/specs/` for existing work.
3. Create `.kiro/specs/<feature>/.config.kiro` with the next sequential id.
4. Write `requirements.md`, then stop for your approval.
5. After approval, inspect your codebase and write `design.md`, then stop.
6. After approval, write `tasks.md`, then stop.
7. On your go-ahead, implement tasks one by one, ticking `- [x]` as each finishes.

Open the same folder in Kiro to view and run the spec there.

## 3. Create or update a Postman collection

Ask ("create a Postman collection for this API", "add the new endpoints to the collection") or run `/kiro-spec-driven:postman-collection`. Claude inspects what exists (collection, OpenAPI document, route definitions, Postman CLI), then generates, hand-authors or updates in place, wires auth, and lints.

## Any language

Both skills work for Node.js, .NET, Python, PHP, Rust, Go, Java, Ruby and mixed repositories. Nothing in the spec format is language-specific, and the Postman skill only deals with HTTP. Claude identifies your stack from its marker files and uses your project's own build, test and OpenAPI tooling.

## 4. Update the plugin

```
/plugin marketplace update claude-kiro-spec-driven
```

## Troubleshooting

- **Skill not listed**: run `/plugin`, check the Installed tab, restart the session.
- **Cannot add the marketplace**: for a private repo, confirm your git SSH key or HTTPS credential can read `rj8b0000/claude-kiro-spec-driven`.
- **Spec id looks wrong**: ids are the highest numeric `specId` + 1; non-numeric legacy ids such as UUIDs are ignored. See `references/spec-id.md` (no Node required).
