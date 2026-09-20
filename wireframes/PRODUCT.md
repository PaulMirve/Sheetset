# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (desktop app design; delivered as a browser prototype, intended for a desktop shell later)

## Stack

static HTML/CSS/JS, no build step

## Users

An internal tool for the owner and a few colleagues at work; it is not marketed or sold, so no screen needs sales copy. Individuals and small teams. A person keeps personal boards and also works in boards shared with teammates. Used at a desk, for hours, as a working surface returned to many times a day.

## Purpose

A kanban board app: multiple boards, each board with its own columns and tasks. Users move tasks across columns to track work.

## Capabilities

- User session: sign in, sign up, profile menu, sign out.
- Multiple boards (personal and shared), switchable from the app shell.
- Per-board columns; tasks within columns; move tasks between columns.
- Shared boards show task assignees.
- Epics: a task can be marked as an epic and other tasks can point at it, one level deep. Children stay ordinary cards in their own columns and carry the epic's chip; the epic card rolls up their progress and expands to list them. Focusing an epic filters the whole board to it. Deleting an epic keeps its tasks.
- Tasks can have subtasks: a checklist added, checked off, renamed and removed from the task dialog (and while creating a task); cards show done/total.
- Create tasks from a meeting: fetch meeting notes from a backend, have an AI produce a summary, decisions and suggested tasks, then review them (all selected by default, deselectable) and add the chosen ones to a column. Suggested assignees are matched to board members by name. Each created task stores its source (meeting id, title, date, platform, link and the quoted note line). Cards show a meeting chip, and the task modal shows the source with an "Open meeting" link.

## Backend (planned, mocked in the prototype)

- `GET /api/meetings` returns a list of meetings (id, title, date, time, duration, source, url, people, notes).
- `POST /api/meetings/:id/extract` returns `{ notes, summary, decisions, tasks: [{ title, who, due (days from today), label, src (index of the source note), why }] }`.

## Out of scope (for now)

- Account switching between multiple signed-in users.
- Live presence indicators.

## Brand commitments

- User asked for an "elegant and modern" design, then chose a rounded, colorful style with plenty of icons and visual cues over a sober or plain one, with generous text sizes. No real name or logo exists yet.

## Open decisions

- Meeting source integrations (Google Meet, Zoom, etc.), which AI provider to use, and how to handle suggested assignees who aren't on the board.
- Product name (placeholder used in the prototype).
- Persistence/backend (prototype stores data locally).
