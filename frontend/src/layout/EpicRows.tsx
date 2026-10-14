import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Avatar from "@components/Avatar";
import Button from "@components/Button";
import Icon from "@components/Icon";
import InlineInput from "@components/InlineInput";
import Menu from "@components/Menu";
import Tag from "@components/Tag";
import { DueTag } from "@components/ToDoCard";
import Typography from "@components/Typography";
import { ColumnDropData } from "@hooks/useBoardDnd";
import { Column } from "@system-types/column";
import { ToDo, ToDoId } from "@system-types/ToDo";
import classNames from "classnames";
import { CSSProperties, ComponentProps, KeyboardEvent, useState } from "react";
import { localDay } from "../dates";
import { hashHue, hue } from "../hue";
import { canMove, doneColumn, waitingOn } from "../tasks";

const alert = { "--h": "var(--alert)" } as CSSProperties;

// Grip, key, title, flags, due, subtasks, assignee, move menu. Due and subtasks go first on narrow screens;
// on phones a row is two lines: title, assignee and menu, then the flags.
const grid =
  "grid grid-cols-[30px_84px_minmax(0,1fr)_minmax(0,230px)_140px_60px_28px_30px] items-center gap-x-3 max-lg:grid-cols-[30px_84px_minmax(0,1fr)_minmax(0,200px)_28px_30px] max-md:grid-cols-[minmax(0,1fr)_28px_30px] max-md:gap-y-1.5";
const wide = "max-lg:hidden";
const notPhone = "max-md:hidden";

type RowProps = {
  todo: ToDo;
  todos: ToDo[];
  columns: Column[];
  onOpen?: () => void;
  onMove?: (column: Column) => void;
} & Omit<ComponentProps<"div">, "children">;

/** One task as a row: what the card shows, laid out to scan down a list. */
export const Row = ({
  todo,
  todos,
  columns,
  onOpen,
  onMove,
  className,
  ...props
}: RowProps) => {
  const sortable = useSortable({ id: todo.id });
  const done = todo.column === doneColumn(columns);
  const blocked = todo.isBlocked || waitingOn(todo, todos, columns).length > 0;
  const finished = todo.subtasks.filter((s) => s.completed).length;
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={classNames(
        grid,
        "group relative min-h-[50px] px-3 py-2 border-t border-line bg-surface hover:bg-[color-mix(in_srgb,var(--color-ground)_60%,var(--color-surface))] max-md:px-4",
        { "opacity-40": sortable.isDragging },
        className,
      )}
      {...props}
    >
      <Button
        variant="icon"
        ref={sortable.setActivatorNodeRef}
        aria-label={`Move ${todo.key}: press Space, then the arrow keys`}
        title="Drag to reorder or move"
        className={classNames("relative z-[1] cursor-grab", notPhone)}
        {...sortable.listeners}
        {...sortable.attributes}
      >
        <Icon name="grip" size={16} />
      </Button>
      <Typography as="span" variant="chip" color="muted" className={notPhone}>
        {todo.key}
      </Typography>
      {/* The whole row opens the task; the grip and the menu sit above this. */}
      <Button
        variant="bare"
        onClick={onOpen}
        className="min-w-0 text-left after:absolute after:inset-0 after:content-['']"
      >
        <Typography
          as="span"
          variant="label"
          className={classNames("block truncate", {
            "text-muted line-through": done,
          })}
          title={todo.title}
        >
          {todo.title}
        </Typography>
      </Button>
      <span className="flex gap-1.5 min-w-0 overflow-hidden max-md:order-last max-md:col-span-full max-md:flex-wrap">
        {blocked && !done && (
          <Tag icon="lock" style={alert}>
            Blocked
          </Tag>
        )}
        {todo.needsHumanReview && !done && (
          <Tag icon="eye" style={alert}>
            Needs review
          </Tag>
        )}
        {todo.label && (
          <Tag dot style={hashHue(todo.label)}>
            {todo.label}
          </Tag>
        )}
        <span className="contents lg:hidden">
          {todo.due && !done && <DueTag due={todo.due} />}
        </span>
        <Typography
          as="span"
          variant="chip"
          color="muted"
          className="self-center md:hidden"
        >
          {todo.key}
        </Typography>
      </span>
      <span className={wide}>
        {todo.due && !done ? (
          <DueTag due={todo.due} />
        ) : (
          <Typography as="span" variant="chip" color="muted">
            —
          </Typography>
        )}
      </span>
      <Typography
        as="span"
        variant="chip"
        color="muted"
        className={classNames(wide, {
          "text-(--hue-4)!":
            todo.subtasks.length > 0 && finished === todo.subtasks.length,
        })}
      >
        {todo.subtasks.length ? `${finished}/${todo.subtasks.length}` : "—"}
      </Typography>
      <span className="relative flex justify-center pointer-events-none">
        {todo.assignee && <Avatar user={todo.assignee} size="sm" />}
      </span>
      <span className="relative opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
        {onMove && (
          <Menu
            label={`Move ${todo.key} to`}
            items={columns.map((c) => {
              const here = c.id === todo.column;
              const ok = canMove(todo, c.id, todos, columns);
              return {
                icon: here ? "check" : "status",
                label: c.name,
                disabled: here || !ok,
                title: here
                  ? "It’s here"
                  : ok
                    ? undefined
                    : "Blocked or waiting on review: it can’t move forward yet",
                onSelect: () => onMove(c),
              };
            })}
          />
        )}
      </span>
    </div>
  );
};

type SectionProps = {
  column: Column;
  index: number;
  rows: ToDo[];
  todos: ToDo[];
  columns: Column[];
  open: boolean;
  onToggle: (open: boolean) => void;
  onOpenTask: (id: ToDoId) => void;
  onMove: (todo: ToDo, column: Column) => void;
  // Resolves once the task exists; rejects if it couldn't be created.
  onAdd: (title: string) => Promise<unknown>;
};

// One status: a collapsible header that's also a drop target, its rows, and an add line.
const Section = ({
  column,
  index,
  rows,
  todos,
  columns,
  open,
  onToggle,
  onOpenTask,
  onMove,
  onAdd,
}: SectionProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { column: column.id } satisfies ColumnDropData,
  });
  const today = localDay();
  const done = column.id === doneColumn(columns);
  const summary = done
    ? []
    : [
        [
          rows.filter(
            (t) => t.isBlocked || waitingOn(t, todos, columns).length > 0,
          ).length,
          "blocked",
        ],
        [rows.filter((t) => t.needsHumanReview).length, "needs review"],
        [rows.filter((t) => t.due && t.due < today).length, "overdue"],
      ].filter(([n]) => n);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  // The title stays until the task exists, so a failed create loses nothing.
  const add = async (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const title = input.value.trim();
    if (e.key !== "Enter" || !title || adding) return;
    e.preventDefault();
    setAdding(true);
    setAddError("");
    try {
      await onAdd(title);
      input.value = "";
    } catch (err) {
      setAddError(
        `Couldn’t add “${title}”: ${err instanceof Error ? err.message : "try again"}.`,
      );
    } finally {
      setAdding(false);
    }
  };
  return (
    <details
      ref={setNodeRef}
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      style={hue(index + 1)}
      className={classNames(
        "group/sec border-t border-line first:border-t-0 transition-shadow",
        {
          "shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--h)_45%,transparent)]":
            isOver,
        },
      )}
    >
      <Typography
        as="summary"
        variant="title"
        className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none bg-[color-mix(in_srgb,var(--h)_7%,var(--color-surface))] hover:bg-[color-mix(in_srgb,var(--h)_12%,var(--color-surface))] [&::-webkit-details-marker]:hidden"
      >
        <Icon
          name="chevron-down"
          size={16}
          className="-rotate-90 text-muted transition-transform duration-200 group-open/sec:rotate-0"
        />
        <span className="dot" aria-hidden />
        {column.name}
        <span className="count-pill">{rows.length}</span>
        <Typography
          as="span"
          variant="chip"
          color="muted"
          className="ml-auto truncate"
        >
          {rows.length === 0
            ? "Empty · drop tasks here"
            : summary.map(([n, what]) => `${n} ${what}`).join(" · ")}
        </Typography>
      </Typography>
      <SortableContext
        items={rows.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {rows.map((t) => (
          <Row
            key={t.id}
            todo={t}
            todos={todos}
            columns={columns}
            onOpen={() => onOpenTask(t.id)}
            onMove={(c) => onMove(t, c)}
          />
        ))}
      </SortableContext>
      <label className="flex items-center gap-3 h-11 pl-[54px] pr-4 border-t border-line text-muted max-md:pl-4">
        <Icon name="plus" size={15} />
        <Typography as="span" color="inherit" className="flex-1 flex min-w-0">
          <InlineInput
            aria-label={`New task in ${column.name}`}
            placeholder={`Add a task to ${column.name}, press Enter`}
            maxLength={200}
            aria-invalid={!!addError || undefined}
            aria-describedby={addError ? `${column.id}-add-error` : undefined}
            readOnly={adding}
            onChange={() => setAddError("")}
            onKeyDown={add}
          />
        </Typography>
        {adding && (
          <Typography as="span" variant="chip" color="muted">
            Adding…
          </Typography>
        )}
      </label>
      {addError && (
        <Typography
          as="p"
          role="alert"
          id={`${column.id}-add-error`}
          color="alert"
          className="px-4 pb-3 pl-[54px] max-md:pl-4"
        >
          {addError}
        </Typography>
      )}
    </details>
  );
};

// Remembered per epic: which non-empty sections you folded. Done starts folded.
const closedKey = (epic: ToDoId) => `epicRows:${epic}`;
const loadClosed = (epic: ToDoId): string[] => {
  const saved = localStorage.getItem(closedKey(epic));
  try {
    return saved ? JSON.parse(saved) : ["done"];
  } catch {
    return ["done"];
  }
};

/** An epic's tasks as rows, one collapsible section per workflow status. */
const EpicRows = ({
  epic,
  columns,
  todos,
  visible,
  onOpenTask,
  onMove,
  onAdd,
}: {
  epic: ToDoId;
  columns: Column[];
  // Every task on the board, so drags keep positions right.
  todos: ToDo[];
  visible: (t: ToDo) => boolean;
  onOpenTask: (id: ToDoId) => void;
  onMove: (todo: ToDo, column: Column) => void;
  onAdd: (column: Column, title: string) => Promise<unknown>;
}) => {
  const [closed, setClosed] = useState(() => loadClosed(epic));
  // Empty sections stay folded unless you open one this visit.
  const [opened, setOpened] = useState<string[]>([]);
  const toggle = (code: string, empty: boolean, open: boolean) => {
    if (empty)
      return setOpened((o) =>
        open ? [...new Set([...o, code])] : o.filter((c) => c !== code),
      );
    const next = open
      ? closed.filter((c) => c !== code)
      : [...new Set([...closed, code])];
    setClosed(next);
    localStorage.setItem(closedKey(epic), JSON.stringify(next));
  };
  return (
    <div className="px-7 pb-8 max-md:px-4">
      <div className="rounded-[20px] bg-surface shadow-rest overflow-hidden">
        <Typography
          variant="chip"
          color="muted"
          aria-hidden
          className={classNames(grid, "px-3 py-2.5 max-md:hidden")}
        >
          <span />
          <span>ID</span>
          <span>Task</span>
          <span>Flags · label</span>
          <span className={wide}>Due</span>
          <span className={wide}>Subtasks</span>
          <span />
          <span />
        </Typography>
        {columns.map((c, i) => {
          const rows = todos.filter((t) => t.column === c.id && visible(t));
          const empty = rows.length === 0;
          return (
            <Section
              key={c.id}
              column={c}
              index={i}
              rows={rows}
              todos={todos}
              columns={columns}
              open={empty ? opened.includes(c.code) : !closed.includes(c.code)}
              onToggle={(open) => toggle(c.code, empty, open)}
              onOpenTask={onOpenTask}
              onMove={onMove}
              onAdd={(title) => onAdd(c, title)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default EpicRows;
