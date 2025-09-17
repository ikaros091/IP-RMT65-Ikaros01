# IP-RMT65-Ikaros01 API Documentation

This document describes the HTTP API provided by the server in `server/app.js`.
It includes endpoints, request/response examples, authentication notes, important environment variables, and test instructions.

---

## Base URL

When running locally in development/test, the app is typically started with the server entrypoint. Tests run the Express `app` directly with Supertest.


## Authentication

- The project uses JWT tokens. The `UserController.login` and `UserController.register` endpoints return tokens.
- Many routes require authentication via the `authentication` middleware. Include an `Authorization` header with value `Bearer <token>` for protected routes.


## Environment variables

- `NODE_ENV` - Node environment (`test`, `development`, `production`).
- `DATABASE_URL` / Sequelize config - database connection is configured via `server/config/config.json` and environment variables.
- `GEMINI_API_KEY` - API key for the Google Generative AI SDK (used by `server/helpers/gemini.js`). Tests mock the SDK and do not require a real key.
- `ENABLE_AI` - when not set to `'true'`, the recommendation endpoint uses a local fallback to avoid remote calls. Tests typically run with AI disabled unless explicitly mocked.


## Endpoints

All routes are defined in `server/app.js`.

### GET /
- Description: Health-check / simple hello
- Request: `GET /`
- Response: `200 OK` with body `Hello World!`


### POST /login
- Description: Authenticate a user and return a JWT
- Request body (JSON):
  - `email` (string)
  - `password` (string)
- Response: `200` with JSON containing `token` (string)


### POST /register
- Description: Create a new user and return a JWT
- Request body (JSON):
  - `username` (string)
  - `email` (string)
  - `password` (string)
- Response: `201` with JSON containing `token` (string)


### GET /animes
- Description: Public anime listing (paginated)
- Query params: `q` (optional search), `limit`, `offset`
- Response: `200` with JSON array of anime objects.


### GET /animes/:id
- Description: Get anime details by ID
- Response: `200` with anime object, or `404` if not found.


### Authenticated routes (require `Authorization: Bearer <token>`)

- POST `/mylist` - add an entry to the logged-in user's MyList
  - Request JSON: `{ anime_id, progress, status }`
  - Response: `201` with created MyList entry

- GET `/mylist` - list the logged-in user's MyList
  - Response: `200` with array of MyList entries (joined with Anime)

- GET `/mylist/:id` - get a single MyList entry for the user
  - Response: `200` MyList entry or `404`

- PUT `/mylist/:id` - update a MyList entry
  - Request JSON: fields to update
  - Response: `200` updated entry

- DELETE `/mylist/:id` - delete an entry
  - Response: `200` on success


### GET /debug/models
- Description: Diagnostic endpoint that returns the list of available generative models as reported by the AI SDK (via `server/helpers/gemini.listAvailableModels`).
- Notes: This route is intended for debugging and may be disabled or removed in production. Tests mock the underlying helper to avoid network calls.
- Response: `200` with `{ models: ... }` or `500` with `{ error: '...' }` if the helper throws


## Recommendation endpoint (controller)
- The recommendation controller (`server/controllers/recommendationController.js`) exposes logic (typically on a route wired in routers) that:
  - Uses the `helpers/gemini` wrapper to pick an AI model and get recommendations.
  - Supports multiple SDK response shapes and falls back to a local recommender when AI is disabled or fails.
  - Enriches AI results by matching titles to the local `Animes` table to add `image_url` when available.
- Tests in `server/__tests__` exercise multiple shapes and the local fallback behavior.


## How to run tests

From the repository root run (PowerShell example):

```powershell
# From repository root
node ./server/node_modules/jest/bin/jest.js --config=./server/jest.config.cjs --coverage --runInBand
```

Or use npm script from `server` if configured (the workspace includes jest installed locally under `server`):

```powershell
cd server
npm test
```


## Notes for contributors
- Tests heavily mock the Google Generative AI SDK (`@google/generative-ai`) or the `helpers/gemini` wrapper to avoid network calls.
- If you add tests that instantiate the real SDK, ensure `GEMINI_API_KEY` is set and that remote requests are acceptable for CI.
- If you see Jest open-handle warnings (`Jest did not exit one second after the test run has completed.`), ensure all resources (DB connections, timers) are closed. There is a `teardown.test.js` that closes Sequelize; other handles may require additional teardown.


---

If you want, I can extend this doc with example cURL commands, more detailed request/response JSON examples, or add a small Postman collection file. Tell me which you'd prefer and I'll add it.
