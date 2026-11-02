# Skill: postman-collection

Creates or updates a Postman collection and Local/Production environments for an HTTP API.

## Paths

| Situation | What happens |
|---|---|
| OpenAPI document exists | `postman spec generate collection <spec> -n "<API> API" --force`, then inspect, preserve hand-added scripts, apply conventions |
| No spec, spec wanted | Flag the gap, get approval before adding minimal OpenAPI middleware, then generate |
| No spec, none wanted | Hand-author a v2.1 collection from the controllers, starting from `references/collection-v21-skeleton.json` |
| Collection exists, API changed | Diff endpoints vs requests; add, change and **remove** in place; lint |

`--force` only adds and updates; requests for deleted endpoints are removed explicitly.

## Conventions (from the Aldo OMS Dashboard API collection)

- Numbered folders: `00 · Authentication` ... `99 · Utilities`.
- Collection-level Bearer `{{accessToken}}`; the Login request overrides it with `noauth`.
- Collection pre-request script auto-logs in when the token is missing or within 2 minutes of expiry, skipping the login request itself.
- Collection test: HTTP 200 everywhere, a warning on 401, `success === true` where the API uses a response envelope.
- `⚠️ mutating` marker on requests that change data; a `Clear stored token` utility request.
- Two environments (Local, Production) with `baseUrl`, `userName`, `password`, `accessToken`, `refreshToken`, `tokenExpiresAt`; secrets typed `secret`.

## Security

Real credentials, tokens and production secrets are never written into files. Committed environments keep secret values empty or reference a Postman vault secret. If an existing environment export contains real values, the skill does not copy them and tells you to rotate them.

## Validation

`postman collection lint` and `postman environment lint` must pass; v2.1 JSON is at least parsed and its `info.schema` checked. The skill reports which requests were only structurally checked versus actually sent.

## Related skills

Mechanics are delegated to `postman:bootstrap`, `postman:api-documentation`, `postman:variables` and `postman:collection-schema-v3`. Running collections, monitors, mocks and CI use the matching `postman:*` skills.
