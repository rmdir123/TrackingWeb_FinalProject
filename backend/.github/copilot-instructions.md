## Quick context — what this service is

This repository is a small Express API for a package-tracking website. It uses a single SQLite database (`./PJ.db`) and exposes routes under `/api/v1`. Swagger UI is available at `/docs` (generated from JSDoc-style comments in `routes/*.js`).

## Key files to read first
- `index.js` — app boot, mounts routes and Swagger UI. Endpoints live under `/api/v1`.
- `db.js` — singleton SQLite connection; `PRAGMA foreign_keys = ON` is enabled.
- `routes/*.js` — endpoint implementations and the in-file Swagger comments that drive `docs/swagger.js`.
- `middlewares/authRequired.js` — centralized JWT auth; verify token and set `req.user = { user_id, role }`.
- `docs/swagger.js` — swagger-jsdoc config; it scans `routes/*.js` for annotations.

## Runtime and developer commands
- Start (prod): `npm start` (runs `node index.js`).
- Dev: `npm run dev` (uses `nodemon index.js`).
- Server listens on port 5000 by default (hard-coded in `index.js`).

## Authentication & tokens (concrete patterns)
- JWTs are signed with `process.env.JWT_SECRET` or a fallback `'dev_secret'`. Token payloads must include `user_id` and `role`.
- Routes expect the header: `Authorization: Bearer <token>` (see `middlewares/authRequired.js` and `routes/*` usage).

## Database & SQL patterns
- Uses `sqlite3` with callback-style API: `db.run`, `db.get`, `db.all` (see `routes/*.js`).
- Timestamps use ISO strings (`new Date().toISOString()`), and queries often use `ORDER BY datetime(created_time)` or similar.
- Helper coercions: `package_route.js` defines `n(v)` and `s(v)` to convert incoming fields into `null`/numbers/strings — follow this pattern when inserting/updating.

## Swagger / API docs
- Swagger is generated from JSDoc `@swagger` blocks inside each `routes/*.js`. Keep comment blocks consistent to have them appear at `/docs`.

## Conventions & gotchas
- Error responses are JSON with an `error` field and many messages are in Thai — preserve language/format when adding similar responses.
- `userinfo_route.js` currently returns all users without auth — note this security surface when changing auth rules.
- Some routes (e.g. `package_route.js`) include their own inline `authRequired` and `requireRole` helpers; prefer the central `middlewares/authRequired.js` if you need shared behavior.
- The codebase mostly uses callbacks (not async/await) for DB operations; be consistent when editing.

## Where to update when changing routes or models
- Add/modify JSDoc `@swagger` blocks inside `routes/*.js` so automatic docs remain accurate.
- Use `db` from `db.js` for all DB access to keep one connection and PRAGMA settings.

## Small examples
- Protected route header: `Authorization: Bearer <token>` (see `routes/history_route.js`).
- Create package pattern: coerce inputs with `n()`/`s()`, set `created_time`/`updated_time` via `new Date().toISOString()`, then `db.run` followed by `db.get` to return the inserted row (see `routes/package_route.js`).

If anything above is unclear or you want the instructions adjusted (more examples, stricter style rules, or added tests/lint steps), tell me which parts to expand. 
