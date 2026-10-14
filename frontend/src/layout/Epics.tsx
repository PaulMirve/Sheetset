import Avatar from "@components/Avatar";
import Button from "@components/Button";
import EmptyState from "@components/EmptyState";
import Files from "@components/Files";
import Icon from "@components/Icon";
import Menu from "@components/Menu";
import RichTextArea from "@components/RichTextArea";
import Segmented from "@components/Segmented";
import Tag from "@components/Tag";
import { notesPlaceholder, useTaskSave } from "@components/TaskParts";
import { SpreadBar } from "@components/TaskPage";
import { DueTag, plain } from "@components/ToDoCard";
import Typography from "@components/Typography";
import { openBoard, openEpics } from "@hooks/useTaskRoute";
import { Board } from "@system-types/Board";
import { Column } from "@system-types/column";
import { ToDo } from "@system-types/ToDo";
import { User } from "@system-types/user";
import classNames from "classnames";
import { CSSProperties, useState } from "react";
import { epicHue, hashHue, hue } from "../hue";
import { EpicStatus, TaskActions, doneColumn, epicStats } from "../tasks";

type Stats = ReturnType<typeof epicStats>;
export type EpicEntry = { epic: ToDo; stats: Stats };

const alert = { "--h": "var(--alert)" } as CSSProperties;

const GROUPS: { status: EpicStatus; title: string; style: CSSProperties }[] = [
  { status: "attention", title: "Needs attention", style: alert },
  { status: "progress", title: "In progress", style: hue(1) },
  { status: "todo", title: "Not started", style: hue(6) },
  { status: "done", title: "Done", style: hue(4) },
];
const rank = (s: EpicStatus) => GROUPS.findIndex((g) => g.status === s);

/** A board's epics with their numbers, most urgent first, then by due date. */
export const epicsOf = (todos: ToDo[], columns: Column[]): EpicEntry[] =>
  todos
    .filter((t) => t.isEpic)
    .map((epic) => ({ epic, stats: epicStats(epic, todos, columns) }))
    .sort(
      (a, b) =>
        rank(a.stats.status) - rank(b.stats.status) ||
        (a.epic.due ?? "9999").localeCompare(b.epic.due ?? "9999"),
    );

// Why an epic needs attention, spelled out as counts.
const Flags = ({ epic, stats }: EpicEntry) => (
  <>
    {stats.blocked > 0 && (
      <Tag icon="lock" style={alert}>
        {stats.blocked} blocked
      </Tag>
    )}
    {stats.review > 0 && (
      <Tag icon="eye" style={alert}>
        {stats.review} needs review
      </Tag>
    )}
    {stats.overdue > 0 && (
      <Tag icon="cal" style={alert}>
        {stats.overdue} overdue
      </Tag>
    )}
    {epic.due && stats.status !== "done" && <DueTag due={epic.due} />}
  </>
);

const people = (tasks: ToDo[]) => [
  ...new Map(
    tasks.flatMap((t) =>
      t.assignee ? [[t.assignee.id, t.assignee] as const] : [],
    ),
  ).values(),
];

const Faces = ({ users }: { users: User[] }) =>
  users.length > 0 && (
    <span className="flex -space-x-1.5">
      {users.slice(0, 3).map((u) => (
        <Avatar key={u.id} user={u} size="sm" className="ring-2 ring-surface" />
      ))}
      {users.length > 3 && (
        <Typography
          as="span"
          variant="chip"
          color="muted"
          className="grid place-items-center size-[26px] rounded-full bg-ground ring-2 ring-surface"
        >
          +{users.length - 3}
        </Typography>
      )}
    </span>
  );

const Progress = ({
  columns,
  stats,
  className,
}: {
  columns: Column[];
  stats: Stats;
  className?: string;
}) => (
  <div className={classNames("grid gap-1.5 min-w-0", className)}>
    <SpreadBar columns={columns} epicTasks={stats.tasks} className="h-2.5" />
    <Typography
      variant="chip"
      color="muted"
      className="flex justify-between gap-3"
    >
      <span>
        {stats.done} of {stats.tasks.length} done
      </span>
      <span>
        {stats.tasks.length
          ? Math.round((stats.done / stats.tasks.length) * 100)
          : 0}
        %
      </span>
    </Typography>
  </div>
);

const EpicRow = ({
  board,
  columns,
  entry,
}: {
  board: Board;
  columns: Column[];
  entry: EpicEntry;
}) => {
  const { epic, stats } = entry;
  return (
    <Button
      variant="bare"
      style={epicHue(epic.id)}
      onClick={() => openEpics(board.key, epic.key)}
      className="grid grid-cols-[minmax(0,1.3fr)_minmax(160px,1fr)_auto] items-center gap-x-6 gap-y-3 p-4 rounded-2xl bg-surface shadow-rest text-left transition-[box-shadow,transform] duration-200 ease-out hover:shadow-lift hover:-translate-y-px max-md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <span className="grid gap-2.5 min-w-0">
        <span className="flex items-center gap-3 min-w-0">
          <span className="tile size-[34px] rounded-[10px]" aria-hidden>
            <Icon name="layers" size={17} />
          </span>
          <span className="min-w-0">
            <Typography
              as="span"
              variant="chip"
              color="muted"
              className="block"
            >
              {epic.key}
            </Typography>
            <Typography as="span" variant="title" className="block truncate">
              {epic.title}
            </Typography>
          </span>
        </span>
        <span className="flex flex-wrap gap-1.5 empty:hidden">
          <Flags {...entry} />
        </span>
      </span>
      <Progress
        columns={columns}
        stats={stats}
        className="max-md:col-span-full max-md:row-start-2"
      />
      <span className="flex items-center gap-3 max-md:row-start-1 max-md:col-start-2 max-md:self-start">
        <Faces users={people(stats.tasks)} />
        <Icon name="chevron-down" className="-rotate-90 text-muted" />
      </span>
    </Button>
  );
};

type Filter = "all" | EpicStatus;

/** The Epics tab: every epic on the board, grouped by what needs you first. */
export const EpicList = ({
  board,
  columns,
  todos,
  onNewEpic,
}: {
  board: Board;
  columns: Column[];
  todos: ToDo[];
  onNewEpic: () => void;
}) => {
  const [filter, setFilter] = useState<Filter>("all");
  const entries = epicsOf(todos, columns);
  const done = doneColumn(columns);
  const loose = todos.filter(
    (t) => !t.isEpic && !t.epic && t.column !== done,
  ).length;
  const count = (s: EpicStatus) =>
    entries.filter((e) => e.stats.status === s).length;

  if (!entries.length)
    return (
      <EmptyState
        icon="layers"
        title={`No epics on ${board.name} yet`}
        className="pb-24"
        action={
          <Button onClick={onNewEpic}>
            <Icon name="plus" /> New epic
          </Button>
        }
      >
        Epics group related tasks, like a launch or a migration, so you can
        track them as one.
      </EmptyState>
    );

  return (
    <div className="min-h-0 overflow-auto px-7 pb-8 max-md:px-4">
      <div className="grid gap-3 max-w-[1100px]">
        <Segmented
          label="Show"
          className="w-fit max-w-full overflow-x-auto [&>label]:flex-auto [&>label]:px-3.5 [&>label]:whitespace-nowrap"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All · ${entries.length}` },
            ...GROUPS.map((g) => ({
              value: g.status,
              label: `${g.title} · ${count(g.status)}`,
            })),
          ]}
        />
        {GROUPS.filter(
          (g) => count(g.status) && (filter === "all" || filter === g.status),
        ).map((g) => {
          const rows = entries
            .filter((e) => e.stats.status === g.status)
            .map((e) => (
              <EpicRow
                key={e.epic.id}
                board={board}
                columns={columns}
                entry={e}
              />
            ));
          const heading = (
            <>
              {g.title}
              <span className="count-pill" style={g.style}>
                {count(g.status)}
              </span>
            </>
          );
          // Finished epics fold away unless you ask for them.
          return g.status === "done" && filter === "all" ? (
            <details key={g.status} className="group grid gap-2.5 mt-3">
              <Typography
                as="summary"
                variant="title"
                color="muted"
                className="flex items-center gap-2.5 cursor-pointer list-none hover:text-ink"
              >
                <Icon
                  name="chevron-down"
                  size={16}
                  className="-rotate-90 transition-transform group-open:rotate-0"
                />
                {heading}
              </Typography>
              <div className="grid gap-2.5 mt-2.5">{rows}</div>
            </details>
          ) : (
            <section
              key={g.status}
              aria-label={g.title}
              className="grid gap-2.5 mt-3"
            >
              <Typography
                as="h2"
                variant="title"
                className="flex items-center gap-2.5"
              >
                {heading}
              </Typography>
              {rows}
            </section>
          );
        })}
        {loose > 0 && filter === "all" && (
          <Button
            variant="bare"
            onClick={() => openBoard(board.key)}
            className="flex items-center gap-3 mt-3 px-4 py-3 rounded-2xl border-[1.5px] border-dashed border-line-strong text-left text-muted hover:text-ink hover:bg-surface"
          >
            <Icon name="inbox" />
            <Typography
              as="span"
              variant="label"
              color="inherit"
              className="flex-1"
            >
              {loose} open task{loose === 1 ? "" : "s"} without an epic
            </Typography>
            <Typography as="span" variant="label" color="inherit">
              Open board
            </Typography>
            <Icon name="chevron-down" className="-rotate-90" />
          </Button>
        )}
      </div>
    </div>
  );
};

export type TaskFilter = "all" | "blocked" | "review" | "mine";

/** Whether a task shows under the epic board's quick filter. */
export const matches = (
  filter: TaskFilter,
  t: ToDo,
  stuck: (t: ToDo) => boolean,
  me?: number,
) =>
  filter === "all" ||
  (filter === "blocked" && stuck(t)) ||
  (filter === "review" && t.needsHumanReview) ||
  (filter === "mine" && t.assignee?.id === me);

// The epic's notes: three lines at rest, the full editor on demand.
const About = ({
  epic,
  onChange,
}: {
  epic: ToDo;
  onChange: TaskActions["onChange"];
}) => {
  const { save } = useTaskSave(onChange);
  const [open, setOpen] = useState(!epic.description);
  return (
    <div className="grid content-start gap-2 min-w-0">
      {open ? (
        <RichTextArea
          label="About this epic"
          icon="notes"
          placeholder={notesPlaceholder(true)}
          defaultValue={epic.description}
          onChange={(description) => save({ description })}
        />
      ) : (
        <>
          <Typography
            variant="label"
            color="muted"
            className="flex items-center gap-1.5 min-h-[34px]"
          >
            <Icon name="notes" size={15} /> About this epic
          </Typography>
          <Typography className="line-clamp-3 max-w-[72ch]">
            {plain(epic.description)}
          </Typography>
        </>
      )}
      {epic.description && (
        <Button
          variant="quiet"
          className="justify-self-start -ml-2.5"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon
            name={open ? "chevron-down" : "pen"}
            size={15}
            className={open ? "rotate-180" : undefined}
          />
          {open ? "Show less" : "Show more and edit"}
        </Button>
      )}
    </div>
  );
};

/** The top of an epic's board: where it sits, what it's about, and how far along it is. */
export const EpicHeader = ({
  board,
  columns,
  entries,
  entry,
  filter,
  counts,
  onFilter,
  onChange,
  onNewTask,
  onActivity,
}: {
  board: Board;
  columns: Column[];
  // Every epic, in the Epics tab's order, for the switcher.
  entries: EpicEntry[];
  entry: EpicEntry;
  filter: TaskFilter;
  counts: Record<TaskFilter, number>;
  onFilter: (f: TaskFilter) => void;
  onChange: TaskActions["onChange"];
  onNewTask: () => void;
  onActivity: () => void;
}) => {
  const { epic, stats } = entry;
  const at = entries.findIndex((e) => e.epic.id === epic.id);
  const go = (i: number) => openEpics(board.key, entries[i].epic.key);
  return (
    <div className="grid gap-5 px-7 pt-[18px] pb-5 max-md:px-4 max-md:pt-3 max-md:gap-4">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 min-h-10"
      >
        <Button
          variant="quiet"
          onClick={() => openBoard(board.key)}
          className="-ml-2.5 text-ink!"
        >
          <span
            aria-hidden
            className="tile size-[22px] rounded-[7px] text-[12px]"
            style={hashHue(String(board.id))}
          >
            {board.name[0].toUpperCase()}
          </span>
          {board.name}
        </Button>
        <Icon name="chevron-down" size={14} className="-rotate-90 text-muted" />
        <Button variant="quiet" onClick={() => openEpics(board.key)}>
          <Icon name="layers" /> Epics
        </Button>
        <Icon name="chevron-down" size={14} className="-rotate-90 text-muted" />
        <Typography as="span" variant="label" color="muted" aria-current="page">
          {epic.key}
        </Typography>
        <span className="flex items-center gap-1 ml-auto">
          <Button
            variant="icon"
            aria-label="Previous epic"
            title="Previous epic"
            disabled={at <= 0}
            onClick={() => go(at - 1)}
          >
            <Icon name="arrow-left" />
          </Button>
          {/* The menu's trigger fills its box. */}
          <span className="w-[104px]">
            <Menu
              label="Switch epic"
              trigger={
                <>
                  <Typography as="span" variant="label" className="truncate">
                    {at + 1} of {entries.length}
                  </Typography>
                  <Icon name="chevron-down" size={15} className="text-muted" />
                </>
              }
              items={entries.map((e) => ({
                icon: "layers",
                label: e.epic.title,
                onSelect: () => openEpics(board.key, e.epic.key),
              }))}
            />
          </span>
          <Button
            variant="icon"
            aria-label="Next epic"
            title="Next epic"
            disabled={at >= entries.length - 1}
            onClick={() => go(at + 1)}
          >
            <Icon name="arrow" />
          </Button>
        </span>
      </nav>

      <header
        className="flex items-start gap-4 max-md:flex-col"
        style={epicHue(epic.id)}
      >
        <span aria-hidden className="tile size-12 rounded-[14px] max-md:hidden">
          <Icon name="layers" size={24} />
        </span>
        <div className="flex-1 min-w-0 grid gap-2">
          <Typography as="h1" variant="headline" className="wrap-anywhere">
            {epic.title}
          </Typography>
          <div className="flex flex-wrap items-center gap-1.5">
            <Flags {...entry} />
            <Faces users={people(stats.tasks)} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <Button variant="secondary" onClick={onActivity}>
            <Icon name="expand" /> Activity
          </Button>
          <Button onClick={onNewTask}>
            <Icon name="plus" /> Task in epic
          </Button>
        </div>
      </header>

      <section
        aria-label="About this epic"
        className="grid grid-cols-[minmax(0,1fr)_320px] gap-8 p-6 rounded-[20px] bg-surface shadow-rest max-lg:grid-cols-1 max-lg:gap-5 max-md:p-4"
      >
        <About key={epic.id} epic={epic} onChange={onChange} />
        <Files boardId={board.id} todo={epic} />
      </section>

      {stats.tasks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Segmented
            label="Show tasks"
            className="w-fit max-w-full overflow-x-auto [&>label]:flex-auto [&>label]:px-3.5 [&>label]:whitespace-nowrap"
            value={filter}
            onChange={onFilter}
            options={[
              { value: "all", label: `All · ${counts.all}` },
              { value: "blocked", label: `Blocked · ${counts.blocked}` },
              { value: "review", label: `Needs review · ${counts.review}` },
              { value: "mine", label: `Mine · ${counts.mine}` },
            ]}
          />
          <Progress
            columns={columns}
            stats={stats}
            className="w-[min(360px,100%)]"
          />
        </div>
      )}
    </div>
  );
};

/** In place of the columns when an epic has no tasks yet. */
export const EmptyEpic = ({
  epic,
  onNewTask,
}: {
  epic: ToDo;
  onNewTask: () => void;
}) => (
  <EmptyState
    icon="layers"
    title={`${epic.title} has no tasks yet`}
    className="pb-16"
    action={
      <Button onClick={onNewTask}>
        <Icon name="plus" /> Task in epic
      </Button>
    }
  >
    Add the first one here, or set this epic on a task from the board.
  </EmptyState>
);
