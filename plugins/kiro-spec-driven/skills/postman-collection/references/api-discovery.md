# Discovering an API in any language

A Postman collection only cares about HTTP: routes, methods, parameters, bodies, auth. The language of the server does not matter. What differs is where the contract lives. Always prefer a real OpenAPI document; fall back to reading route definitions from the code.

## 1. Look for an OpenAPI document first

Search for `openapi.json`, `openapi.yaml`, `swagger.json`, `swagger.yaml`, or a URL the running app serves. If none is committed, many frameworks can produce one:

| Ecosystem / framework | Where the spec comes from |
|---|---|
| ASP.NET Core | Swashbuckle (`/swagger/v1/swagger.json`), NSwag, `Microsoft.AspNetCore.OpenApi` (`/openapi/v1.json`) |
| Node: NestJS | `@nestjs/swagger` (`/api-json`) |
| Node: Express / Fastify / Koa | `swagger-jsdoc`, `express-openapi-validator`, `@fastify/swagger` (`/documentation/json`) |
| Python: FastAPI | built in (`/openapi.json`) |
| Python: Django REST framework | `drf-spectacular` or `drf-yasg` |
| Python: Flask | `flask-smorest`, `apispec`, `flasgger` |
| PHP: Laravel | `dedoc/scramble`, `darkaonline/l5-swagger` |
| PHP: Symfony | `nelmio/api-doc-bundle` |
| Java / Kotlin: Spring Boot | springdoc-openapi (`/v3/api-docs`) |
| Go | `swaggo/swag`, `oapi-codegen`, go-swagger |
| Rust | `utoipa` (Axum / Actix), `aide`, `paperclip` |
| Ruby on Rails | `rswag`, `grape-swagger` |

If the project uses none of these, tell the user, and either add the framework's standard OpenAPI integration (with approval) or hand-author the collection from the routes.

## 2. Reading routes from code (hand-authored path)

Find every endpoint: HTTP method, path template, required auth or role, path/query/body parameters, response shape.

| Ecosystem | Where routes are declared |
|---|---|
| ASP.NET Core | controllers with `[Route]`/`[HttpGet]`..., minimal APIs `app.MapGet(...)` |
| Node: Express / Koa | `router.get(...)`, `app.post(...)` |
| Node: NestJS | `@Controller` with `@Get/@Post...` |
| Node: Fastify | `fastify.route(...)`, `fastify.get(...)` |
| Python: FastAPI / Flask | `@app.get(...)`, `@router.post(...)`, `@app.route(...)` |
| Python: Django | `urls.py`, DRF routers and viewsets |
| PHP: Laravel | `routes/api.php`, `php artisan route:list` |
| PHP: Symfony | `#[Route]` attributes, `bin/console debug:router` |
| Java / Kotlin: Spring | `@RestController` with `@GetMapping`... |
| Go | `http.HandleFunc`, chi/gin/echo/fiber router calls |
| Rust | Axum `Router::route`, Actix `#[get]`/`web::resource` |
| Ruby on Rails | `config/routes.rb`, `rails routes` |

If the framework offers a route listing command (`php artisan route:list`, `rails routes`, `bin/console debug:router`), use it as a cross-check, not as the only source: it omits request and response shapes.

## 3. Base URL, login route and token shape

Find these in the project, never guess:

- **Base URL (Local)**: the dev server's configured port (framework config, `.env`, `launchSettings.json`, `appsettings.Development.json`, `package.json` scripts, `docker-compose.yml`, `README`).
- **Login route and body**: the auth controller, handler or router; check the field names (`userName`, `email`, `username`) and the response shape (`token`, `accessToken`, `access_token`, nested under `data`).
- **Token lifetime**: JWT settings or auth config. If it is not stated, the pre-request script assumes 60 minutes; note that as an assumption.
- **Non-bearer schemes** (API key header, cookie sessions, OAuth2): adapt collection auth accordingly and say so; the auto-login script in `collection-prerequest.js` is for username/password to bearer-token flows.

Adjust the `LOGIN_PATH` constant and the request body field names in the scripts to match.

## 4. Gaps are reported, not guessed

Missing spec, unknown login route, unknown token field, multiple auth schemes: list them for the user and proceed only with what the code confirms.
