# Sheetset

A Kanban workspace for organizing boards, tasks and meeting follow-ups. The React
frontend runs in a browser or a Tauri desktop window, backed by a FastAPI API and
a local SQLite database.

## Features

- Boards with a fixed workflow: **To do → Doing → Code review → Ready for QA → Done**.
- Tasks with subtasks, epics, dependencies, attachments and review flags.
- Account authentication and board membership.
- Meeting ingestion from n8n, with suggested tasks to review and accept.
- API endpoints for reserving tasks and recording execution history.
- A shared UI component library with Storybook previews.

## Project layout

| Directory | Contents |
| --- | --- |
| [`backend/`](backend/README.md) | FastAPI application, SQLite models, migrations and tests |
| [`frontend/`](frontend/README.md) | React, TypeScript, Vite and Tauri application |
| [`backend/bruno/`](backend/bruno/) | Bruno API request collection |
| [`wireframes/`](wireframes/) | HTML prototype and design documents |

## Local setup

Install Python, Node.js and Yarn. The optional desktop app also requires Rust
and the platform dependencies for Tauri 2.

### Backend

From the project root:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt 'uvicorn[standard]'
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Set `SECRET_KEY` in `backend/.env` to the generated value. Keep `DB_PATH` and
`CORS_ORIGINS` as provided for local development. Set `N8N_API_KEY` to a separate
generated key if you use meeting ingestion; leaving it empty disables ingestion.
If `.env` already exists, keep it rather than copying over it.

Start the API from `backend/`:

```sh
python -m uvicorn app.main:app --reload --port 9002 --env-file .env
```

The API runs at <http://127.0.0.1:9002>, with interactive documentation at
<http://127.0.0.1:9002/docs>. Startup creates the database and applies migrations.
Existing databases are backed up before migration changes; see the
[backend documentation](backend/README.md) for upgrade and rollback details.

### Frontend

In a second terminal, from the project root:

```sh
cd frontend
yarn install
yarn dev
```

Open <http://localhost:1420> and create an account. The frontend connects to
`http://127.0.0.1:9002` by default. To use another API, set `VITE_API_URL` in
`frontend/.env.local` and restart Vite. Allow the frontend origin in the
backend's `CORS_ORIGINS` configuration.

For the desktop app, run `yarn tauri dev` from `frontend/` with the backend running.
The desktop bundle requires the backend to be run separately. Changing the API
address may also require updating the Tauri content security policy.

## Development

Run backend tests from `backend/`:

```sh
.venv/bin/python -m pip install pytest httpx
.venv/bin/python -m pytest tests -q
```

Tests use temporary databases. Run frontend checks from `frontend/`:

```sh
yarn typecheck
yarn eslint src
yarn vitest run --config vitest.workflow.config.ts
```

Use `yarn storybook` to preview components, `yarn build` to build the web app,
or `yarn tauri build` to build the desktop app.

Read the [UI guidelines](frontend/UI.md) before changing screens or components.
The [backend README](backend/README.md) documents workflow rules, migrations and
execution endpoints.

## Local credentials and data

Keep credentials in ignored `.env` files. Only the empty `.env.example` templates
belong in Git. The local database and migration backups are also ignored.
Never save session tokens or real passwords in API collections, fixtures or
execution events. `VITE_` variables are included in the frontend bundle, so use
them only for public configuration.

For Bruno, copy `backend/bruno/.env.example` to `backend/bruno/.env`, configure
the local password and optional n8n key, and select the `local` environment.
Login populates the session token for subsequent requests.
