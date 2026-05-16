# Planning notes — Bookmark Manager API

Written before opening the AI agent for code generation. These are working notes, not polished docs.

## Task list (ordered by dependency)

The plan is to ship 8 small chunks, each built–verified–committed before the next one starts.

1. **Scaffold** — npm init, Express + TypeScript + Jest + Supertest + Zod + pino installed, `tsconfig.json`, `src/index.ts` that boots Express, `.gitignore`. No routes yet.
2. **Data layer** — `Bookmark` type + an in-memory repository (`createBookmark`, `listBookmarks`, `getBookmark`, `updateBookmark`, `deleteBookmark`). Sanity roundtrip script.
3. **POST /bookmarks** vertical slice — handler + Zod schema + error handling + tests (happy path + invalid URL).
4. **GET /bookmarks** vertical slice — list endpoint with optional `?tag=` filter + tests (no filter, filter hits, filter misses).
5. **GET /bookmarks/:id** vertical slice — fetch one + 404 + tests.
6. **PUT /bookmarks/:id** vertical slice — partial update + validation + 404 + tests.
7. **DELETE /bookmarks/:id** vertical slice — delete + 404 + tests (204 on success).
8. **Health check + env config** — `GET /health`, read `PORT` and `LOG_LEVEL` from env with defaults, `.env.example` documenting them. Final production-checklist review pass after this.

Each endpoint extends the data layer only as needed. I am not adding a data-layer method until a slice forces it.

## Definition of done per chunk

| Chunk | "Verified" means                                                                                              |
|-------|---------------------------------------------------------------------------------------------------------------|
| 1     | `npm install` succeeds, `npx tsc --noEmit` returns 0, `npm start` boots without crashing.                     |
| 2     | I can import the repository, create a bookmark, retrieve it, and the round-trip matches (sanity script).      |
| 3–7   | The new tests pass. Existing tests still pass. A `curl` against the live server matches expectations. Bad input returns 400, not a crash. |
| 8     | `curl /health` returns `{"status":"ok"}`. Setting `PORT=4000` actually starts on 4000. `.env.example` exists. |

## Three production standards I will hold every chunk to

Picked from the Production Level Code lesson. These three, not "all of them" — I want to actually enforce three rather than half-enforce ten.

1. **Input validation** — every write endpoint (POST, PUT) parses the body through a Zod schema before touching the repository. `url` must be a real URL. `title` must be a non-empty trimmed string. Tags must be an array of strings. Reject with **400** and a structured error body (`{ error: { code, message, details } }`), never a 500.
2. **Structured error handling** — no `throw new Error('boom')` reaching the client. A central Express error middleware turns thrown errors into JSON with the correct HTTP status. 404 for unknown resources, 400 for validation, 500 only for genuinely unexpected failures (and the 500 body never leaks stack traces).
3. **Structured logging** — `pino` with a child logger per request, carrying a request id. Every request gets one start log and one end log with status + duration. Errors are logged with the request id so I can correlate. `LOG_LEVEL` is env-driven; tests run at `silent`.

## Reflection placeholder

I will fill this in at the end with one concrete moment when Build-Verify-Commit caught something, and one moment I was tempted to skip verification.
