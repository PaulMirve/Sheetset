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


## Orchestrator reservations

`POST /tasks/{id}/claim` accepts `execution_id` (UUID), `expected_board_id`,
`project`, `profile`, `developer` and `reviewer`. It reserves the SQLite writer,
checks membership and current eligibility, inserts the execution and moves a
concrete To do task to Doing in one transaction. Blocked flags or unfinished
blockers cause 409. A competing execution gets 409; an identical retry with the
same execution ID returns the original execution. Returning an active task to
To do manually does not remove its reservation.

`GET /tasks/{id}/executions` and `GET /executions/{uuid}/events` expose history
to board members. The owning user can append an event through
`POST /executions/{uuid}/events` with `event_id`, `kind`, `payload`; duplicate IDs
are idempotent only for identical content, and payloads are capped at 64 KB.
Store large reports using the existing file endpoint. Never put credentials in
events. History survives completion; deleting the task deletes its executions.

`POST /executions/{uuid}/stage` accepts `stage` (doing or code_review) and
`expected_column_id`. It verifies an active execution, attention flags and the
observed column before moving the task. The orchestrator must also compare its
saved specification against the current ticket before continuing: column checks
do not detect all concurrent edits to title, description or dependencies.

`POST /executions/{uuid}/finish` accepts `status` (ready_for_qa,
needs_human_review or cancelled) and `expected_column_id`. Ready for QA requires
the current Code review stage and normal dependency/flag validation. Cancellation
or escalation leaves the column unchanged and sets needs_human_review. Finishing
releases the active reservation but preserves history. Only the execution's
owning user may write events or finish. A completed execution never starts again
merely because its original claim is retried.

These endpoints use the same bearer authentication as task CRUD. Existing UI
and task endpoints remain compatible. Automations must use the claim endpoint;
a GET followed by ordinary PATCH to Doing is not a reservation. No automatic
expiry is implemented: a crashed execution remains reserved for explicit recovery.

Startup adds the execution tables transactionally and backs up an existing
database before the addition. Existing task fields, column IDs and memberships
are preserved. Rollback follows the backup procedure above; retain new execution
history before restoring an older backup.
