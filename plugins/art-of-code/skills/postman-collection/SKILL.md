---
name: postman-collection
description: Use this skill to create or update a Postman collection (and its Local/Production environments) for an HTTP API — "create a Postman collection for this API", "generate a collection from the OpenAPI spec", "add the new endpoints to the collection", "sync the collection with the routes", "remove stale requests", "set up bearer auth / auto-login in Postman". Works for an API written in any language or framework (Node.js, .NET, Python, PHP, Rust, Go, Java, Ruby and more), from an OpenAPI document when one exists (via the Postman CLI) and otherwise from the API's route definitions, following the conventions of the Aldo OMS Dashboard API collection: numbered folders, collection-level Bearer `{{accessToken}}`, an auto-login pre-request script, collection-level tests, mutating-request markers, and environments with secrets kept out of Git. Do NOT use it for running or load-testing collections, monitors, mocks, or CI wiring — use the matching `postman:*` skills for those.
---

# Create or update a Postman collection

Produces a collection that is easy to import, authenticates by itself, and stays in sync with the API. The collection is a derived artifact: the API's contract (OpenAPI document, or the route definitions when there is no spec) is the source of truth, and hand-added scripts, examples and assertions in an existing collection carry knowledge the generator does not have, so they are preserved, never clobbered.

HTTP is the only thing a collection cares about, so the server's language never matters; only where the contract lives differs. `references/api-discovery.md` maps each ecosystem (ASP.NET, Express/NestJS/Fastify, FastAPI/Django/Flask, Laravel/Symfony, Spring, Go, Rust, Rails) to its OpenAPI source and route declarations.

Conventions and ready-made scripts live in `references/`: `conventions.md`, `api-discovery.md`, `collection-prerequest.js`, `collection-test.js`, `login-test.js`, `collection-v21-skeleton.json`. Read `conventions.md` and `api-discovery.md` first. For Postman CLI mechanics, defer to the existing `postman:bootstrap`, `postman:api-documentation`, `postman:variables` and `postman:collection-schema-v3` skills rather than reimplementing them.

## 1. Inspect what exists

Before changing anything, find out which mode applies (summarize it to the user in a few lines):

- An existing collection? Look for `*.postman_collection.json`, a `postman/` folder, `.postman/resources.yaml`. Note its format (v2.1 JSON or v3 YAML), folders, auth, scripts and environments.
- A contract source? Look for an OpenAPI/Swagger document or the framework's OpenAPI integration, then the route definitions (see `references/api-discovery.md` for the framework in use).
- Postman CLI available? `postman --version`. If not, `postman:bootstrap` covers setup, or fall back to hand-authoring v2.1 JSON.
- Base URL and login route: the dev server config (`.env`, framework config, run scripts, `docker-compose.yml`, README) and the auth route handler.

Gaps (no spec, unknown login route, unknown token shape) are listed for the user, not guessed.

## 2. Pick the path

| Situation | Path |
|---|---|
| OpenAPI document exists | **Generate/update from the spec** (step 3a) |
| No spec, user wants a spec | Flag the gap and get approval before adding minimal OpenAPI middleware, then 3a |
| No spec, no appetite for one | **Hand-author from the route definitions** (step 3b) |
| Collection exists, API changed | **Update in place** (step 4) |

## 3a. Generate from OpenAPI

1. Regenerate the OpenAPI document so it reflects the current code.
2. Generate or update with the Postman CLI, targeting the existing collection path so entities update in place:

   ```bash
   postman spec generate collection <openapi-path> -n "<API name> API" --force
   ```

3. Inspect the result before keeping it. Hand-added scripts, examples and assertions must survive. `--force` adds and updates but never deletes.
4. Apply the auth setup (step 5) and folder conventions (`conventions.md`).

## 3b. Hand-author from the route definitions

1. List every route: handler (controller, router, view, resource), HTTP method, path template, required role, query/body parameters, response shape. Read them from the code, not from memory; a framework route-listing command is a useful cross-check but omits request and response shapes.
2. Start from `references/collection-v21-skeleton.json`, replace the placeholder name and description, and add one numbered folder per resource area with a request per action. Include sample bodies and query parameters (optional ones disabled), descriptions, and the `⚠️ mutating` marker on writes.
3. Put chained values (ids returned by list requests, used by detail requests) in collection variables with harmless sample defaults and document each chain in the collection description.

## 4. Update an existing collection

1. Regenerate or re-read the contract, then diff the API's current endpoints against the collection's requests: **added**, **changed** (route, parameters, body), **removed**.
2. Add and change requests in place; keep scripts, examples and assertions on untouched requests.
3. **Delete requests whose endpoint no longer exists** (and their paired `.resources/<request-name>.resources/` folder in v3 projects). Regeneration alone never removes them.
4. Re-check folder numbering and the collection description's chain/pagination notes.
5. Treat the code change, the collection update and the orphan check as one unit of work.

## 5. Authentication and environments

- Collection auth: Bearer `{{accessToken}}`. The Login request overrides it with `noauth` and uses `references/login-test.js`. Add `references/collection-prerequest.js` (auto-login) and `references/collection-test.js` as collection events; set `LOGIN_PATH` in the pre-request script to the real login route.
- Create two environments, Local and Production, with `baseUrl`, `userName`, `password`, `accessToken`, `refreshToken`, `tokenExpiresAt`. Mark `password`, `accessToken` and `refreshToken` as secret.
- **Never write real credentials, tokens, passwords or production secrets into any file.** Leave secret values empty or point at a Postman vault secret (`postman:variables`). If an existing environment export contains real values, do not copy them anywhere, and tell the user so they can rotate them.

## 6. Validate and report

- `postman collection lint <path>` (and `postman environment lint` for environment changes) must pass. For a v2.1 JSON file, at least parse it with any JSON parser (`jq .`, `python -m json.tool`, `node -e`) and confirm `info.schema` is the v2.1.0 URL.
- Report: what was created, added, changed and removed; what was preserved; what was left as a gap (unknown login shape, missing spec); and the exact import steps for a teammate. Never claim a request works without having sent it; say which ones were only structurally checked.
