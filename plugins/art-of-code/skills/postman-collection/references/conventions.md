# Collection conventions

Taken from the Aldo OMS Dashboard API collection (25 requests in 8 folders) and generalized. Follow these when hand-authoring or reshaping a collection; when a collection already exists, match what is there before applying anything here.

## Structure

- Numbered folders so Postman sorts them in workflow order: `00 · Authentication`, `01 · <Resource>`, `02 · <Resource>` ... `99 · Utilities`. Group by resource or feature area, not by HTTP verb.
- Request names say what the request does: `API 2 — Order List`, `Login  →  captures {{accessToken}}`. Keep the numbering from the API's guide or spec if it has one.
- Every request has a description: purpose, notable query parameters (defaults and allowed values), role restrictions, response shape. Optional query parameters are included but **disabled**, with the default and allowed values in the description column.
- Requests that change data carry a `⚠️ mutating` marker in the name or description so nobody fires them against production by accident.
- `99 · Utilities` holds helpers such as `Clear stored token (force re-login)`.

## Authentication

- Collection-level auth: Bearer `{{accessToken}}`, inherited by every request. Only the login request overrides it with `noauth`.
- One explicit Login request whose test script (`references/login-test.js`) writes `accessToken`, `tokenExpiresAt` and, when returned, `refreshToken` into the **environment**.
- A collection-level pre-request script (`references/collection-prerequest.js`) logs in automatically when the token is missing or within 2 minutes of expiry, skips the login request itself, tolerates both a bare body and a `{ success, data }` envelope, and warns instead of failing when `baseUrl`, `userName` or `password` are missing.
- A refresh-token endpoint, if the API has one, follows the same capture pattern.

## Tests

- Collection-level test (`references/collection-test.js`): HTTP 200 on every request, a console warning on 401, and `envelope.success === true` wherever the API uses a success envelope.
- Per-request tests only where they add something the collection test does not (specific fields, chained-variable capture).
- Chain values between requests with collection variables (for example a list request captures `auditLogId` for the detail request). Document each chain in the collection description.

## Variables and environments

- Two environments: Local and Production. Each has `baseUrl`, `userName`, `password`, `accessToken`, `refreshToken`, `tokenExpiresAt`, plus any API-specific ids or date windows.
- `password`, `accessToken` and `refreshToken` are `secret` typed.
- **Committed environment files never contain real credential values.** Leave secret values empty, or reference a Postman vault secret. Never copy values from an existing environment export into a repository, doc or spec.
- Local `baseUrl` matches the project's dev server URL (see `api-discovery.md` for where each framework configures it).
- Collection variables hold sample ids used by default requests; they must be harmless sample data, never real customer identifiers.

## Format

- Hand-authored or imported collections are Postman Collection v2.1.0 JSON (`references/collection-v21-skeleton.json` is the starting point; plugin maintainers rebuild it with `node references/build-skeleton.mjs` after editing the scripts; using the skill never requires Node). The scripts run inside Postman, so the API's own language is irrelevant.
- Git-native projects using Postman CLI v3 YAML (`postman/collections/...`) follow the `postman:collection-schema-v3` skill instead.
