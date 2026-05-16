# Bookmark Manager API

A minimal REST API for managing bookmarks (URL, title, description, tags).
Built incrementally with the Build–Verify–Commit workflow.

## Quick start

```bash
npm install
npm run dev   # starts the server with ts-node
npm test      # runs the jest suite
```

The server reads configuration from environment variables — see `.env.example`.

## Endpoints (will be added incrementally)

| Method | Path              | Purpose                                                 |
|--------|-------------------|---------------------------------------------------------|
| GET    | `/health`         | Liveness probe — returns `{"status":"ok"}`              |
| POST   | `/bookmarks`      | Create a bookmark                                       |
| GET    | `/bookmarks`      | List bookmarks, optional `?tag=` filter                 |
| GET    | `/bookmarks/:id`  | Fetch one bookmark                                      |
| PUT    | `/bookmarks/:id`  | Update a bookmark                                       |
| DELETE | `/bookmarks/:id`  | Delete a bookmark                                       |

See `PLANNING.md` for the chunk-by-chunk task breakdown and production standards.
