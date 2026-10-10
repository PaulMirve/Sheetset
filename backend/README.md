# Kanban API

The board workflow is fixed:

| Code | Display name |
| --- | --- |
| `todo` | To do |
| `doing` | Doing |
| `code_review` | Code review |
| `ready_for_qa` | Ready for QA |
| `done` | Done |

`GET /boards` and `GET /boards/{id}` return each column's `id`, `code`,
`name` and `position`. Clients resolve the destination by `code`, then use its
existing numeric ID in `PATCH /tasks/{id}`. Only `done` completes dependencies.
Moving a ticket from code review back to doing remains supported.

Column creation, renaming, reordering and deletion endpoints have been removed.
Board creation provisions all five stages. Existing task CRUD, files, epics,
dependencies, authentication and meeting ingestion routes remain available.

Tasks also expose `is_blocked` and `needs_human_review`, both defaulting to false.
They can be updated individually through the existing task PATCH endpoint without
changing the column. Either flag prevents moving forward (409), while returning
to an earlier stage and reordering within a stage remain possible. A PATCH can
clear a flag and move the task together; all remaining flags and dependencies
are checked before committing.

## Upgrade existing databases

Stop the old backend, then start the updated backend using your existing launch
configuration and reload the frontend. Startup runs the SQLite migration in a
transaction before serving requests. There is no need to change the `.env` file.

Before changing a legacy database, the migration saves a complete SQLite backup
to `.db-backups/` beside the configured database and prints its path in the
backend log. This folder is ignored by Git. Existing column IDs, task IDs,
task-to-column assignments and task content are preserved. Missing stages are
added; known stages are assigned their stable codes and canonical order.
Repeated startup does not create duplicate stages or additional backups.

Unknown or duplicate legacy stages stop startup before changing the database.
They require an explicit mapping instead of guessing what their tasks mean.
An error after changes begin rolls back both schema and data.

To roll back an upgrade, stop the backend, restore the previous application
version, and restore the saved SQLite backup to the configured database path.
Keep a copy of the current database first if work was saved after the upgrade:
the pre-upgrade backup does not include that later work.

## Verification

Run `.venv/bin/python -m pytest tests -q` from `backend/`. Tests use temporary
databases and reset database contents and login throttling between cases.

From `frontend/`, run `yarn typecheck`, `npx eslint src`,
`npx vitest run --config vitest.workflow.config.ts` and
`npx vitest run --project storybook`.
