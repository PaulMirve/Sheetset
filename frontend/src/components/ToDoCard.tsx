import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToDo } from "@system-types/ToDo";
import classNames from "classnames";
import { useState } from "react";
import Avatar from "./Avatar";
import Button from "./Button";
import Icon from "./Icon";
import Tag from "./Tag";
import { fmtDate, localDay } from "../dates";
import { epicHue, hashHue, hue } from "../hue";
import Typography from "./Typography";

// Overdue → alert red, due within 2 days → amber, else neutral.
// Card preview of markdown notes: drop the syntax, keep the words.
// ponytail: regex strip covers what the editor writes; swap for a markdown parser if previews look off.
export const plain = (md: string) =>
  md
    .replace(/```[^\n]*\n?/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/(?<!\\)(\*\*|__|~~|[*_`])/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, "$1");

export const DueTag = ({ due }: { due: string }) => {
  const late = due < localDay();
  const soon = !late && due <= localDay(2);
  const date = fmtDate(due);
  return (
    <Tag
      icon="cal"
      style={
        late
          ? ({ "--h": "var(--alert)" } as React.CSSProperties)
          : soon
            ? hue(2)
            : undefined
      }
    >
      {late ? `Overdue · ${date}` : date}
    </Tag>
  );
};

// One of an epic's tasks, with the index of the column it sits in.
export type EpicTaskRow = { todo: ToDo; column: number; done: boolean };

type EpicProps = {
  // Set on an epic's card: its tasks in board order.
  epicTasks?: EpicTaskRow[];
  // The epic this task belongs to.
  parent?: ToDo;
  // Tasks this one waits on that aren't done yet.
  blockers?: ToDo[];
  onOpenTask?: (id: ToDo["id"]) => void;
  onAddToEpic?: () => void;
};

// Rolled-up progress and a disclosure listing the epic's tasks.
// Its clicks and keys stay here, so they don't open or drag the epic's card.
const EpicBody = ({
  epicTasks,
  onOpenTask,
  onAddToEpic,
}: Required<Pick<EpicProps, "epicTasks">> & EpicProps) => {
  const [open, setOpen] = useState(false);
  const done = epicTasks.filter((t) => t.done).length;
  const row =
    "flex items-center gap-2 h-8 px-2.5 rounded-lg bg-ground text-left hover:bg-[color-mix(in_srgb,var(--h)_13%,var(--color-ground))]";
  const addRow = (
    <Button
      variant="bare"
      className={classNames(
        row,
        "bg-transparent! text-muted shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]",
      )}
      onClick={onAddToEpic}
    >
      <Icon name="plus" size={14} />
      <span className="truncate">
        {epicTasks.length ? "Add task to this epic" : "Add the first task"}
      </span>
    </Button>
  );
  return (
    <div
      className="grid gap-2 cursor-default"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {epicTasks.length === 0 ? (
        <>
          <Typography
            color="muted"
            className="py-2.5 px-3 rounded-[10px] border-[1.5px] border-dashed border-line-strong text-center"
          >
            No tasks in this epic yet.
          </Typography>
          {onAddToEpic && addRow}
        </>
      ) : (
        <>
          <div
            role="progressbar"
            aria-label="Tasks done in this epic"
            aria-valuemin={0}
            aria-valuemax={epicTasks.length}
            aria-valuenow={done}
            className="h-1 rounded-full bg-line-strong overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-(--hue-4) transition-[width] duration-300 ease-out"
              style={{ width: `${(done / epicTasks.length) * 100}%` }}
            />
          </div>
          <Button
            variant="quiet"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="h-8 -mx-1 px-1.5 justify-start"
          >
            <Icon
              name="chevron-down"
              size={15}
              className={classNames("transition-transform", {
                "rotate-180": open,
              })}
            />
            {epicTasks.length} task{epicTasks.length > 1 ? "s" : ""}
            <span
              className={classNames("ml-auto tabular-nums", {
                "text-(--hue-4)": done === epicTasks.length,
              })}
            >
              {done} done
            </span>
          </Button>
          {open && (
            <Typography
              as="div"
              variant="chip"
              className="grid grid-cols-[minmax(0,1fr)] gap-1"
            >
              {epicTasks.map((item) => (
                <Button
                  variant="bare"
                  key={item.todo.id}
                  style={hue(item.column + 1)}
                  title={item.todo.title}
                  className={row}
                  onClick={() => onOpenTask?.(item.todo.id)}
                >
                  {item.done ? (
                    <Icon
                      name="check"
                      size={14}
                      style={{ color: "var(--hue-4)" }}
                    />
                  ) : (
                    <span className="size-[7px] rounded-full flex-none bg-(--h)" />
                  )}
                  <span
                    className={classNames("flex-1 min-w-0 truncate", {
                      "text-muted line-through": item.done,
                    })}
                  >
                    {item.todo.title}
                  </span>
                </Button>
              ))}
              {onAddToEpic && addRow}
            </Typography>
          )}
        </>
      )}
    </div>
  );
};

type CardProps = {
  todo: ToDo;
  className?: string;
} & EpicProps &
  Omit<React.ComponentProps<"article">, "className">;

export const Card = ({
  todo,
  className,
  epicTasks,
  parent,
  blockers = [],
  onOpenTask,
  onAddToEpic,
  style,
  ...props
}: CardProps) => {
  const { title, description, subtasks, label, due, assignee, source, files } =
    todo;
  const done = subtasks.filter((st) => st.completed).length;
  return (
    <article
      aria-label={todo.isEpic ? `Epic: ${title}` : title}
      style={todo.isEpic ? { ...epicHue(todo.id), ...style } : style}
      className={classNames(
        "grid gap-2.5 pt-3 px-3 pb-[11px] bg-surface rounded-xl shadow-rest cursor-grab transition-[box-shadow,transform,opacity] duration-200 ease-out hover:shadow-lift hover:-translate-y-px",
        {
          "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--h)_28%,transparent),var(--shadow-rest)] hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--h)_42%,transparent),var(--shadow-lift)]":
            todo.isEpic,
        },
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-[9px]">
        {todo.isEpic && (
          <span className="tile size-[26px] rounded-lg" aria-hidden>
            <Icon name="layers" size={15} />
          </span>
        )}
        <Typography variant="title" className="wrap-anywhere min-w-0">
          {title}
        </Typography>
      </div>
      {description && (
        <Typography color="muted" className="-mt-1 line-clamp-2">
          {plain(description)}
        </Typography>
      )}
      {(label ||
        due ||
        source ||
        parent ||
        blockers.length > 0 ||
        todo.isBlocked ||
        todo.needsHumanReview) && (
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {(blockers.length > 0 || todo.isBlocked) && (
            <Tag
              icon="lock"
              style={{ "--h": "var(--alert)" } as React.CSSProperties}
              title={
                blockers.length
                  ? `Waiting on ${blockers.map((b) => b.key).join(", ")}`
                  : "This task is blocked"
              }
            >
              Blocked
            </Tag>
          )}
          {todo.needsHumanReview && (
            <Tag
              icon="lock"
              style={{ "--h": "var(--alert)" } as React.CSSProperties}
            >
              Needs human review
            </Tag>
          )}
          {parent && (
            <Tag
              icon="layers"
              style={epicHue(parent.id)}
              className="max-w-full"
              title={`Part of “${parent.title}”`}
            >
              {parent.title}
            </Tag>
          )}
          {source && (
            <Tag
              icon="video"
              style={hue(3)}
              className="max-w-full"
              title={`Created from the meeting “${source.title}”`}
            >
              {source.title}
            </Tag>
          )}
          {label && (
            <Tag dot style={hashHue(label)} className="max-w-full">
              {label}
            </Tag>
          )}
          {due && <DueTag due={due} />}
        </div>
      )}
      {epicTasks && (
        <EpicBody
          epicTasks={epicTasks}
          onOpenTask={onOpenTask}
          onAddToEpic={onAddToEpic}
        />
      )}
      <Typography
        variant="chip"
        color="muted"
        className="flex items-center gap-2.5 min-h-6 pt-[9px] border-t border-line"
      >
        <span>{todo.key}</span>
        {description && (
          <span title="Has notes" className="inline-flex">
            <Icon name="notes" size={15} />
          </span>
        )}
        {files.length > 0 && (
          <span
            className="inline-flex items-center gap-1 tabular-nums"
            title={`${files.length} attachment${files.length > 1 ? "s" : ""}`}
            aria-label={`${files.length} attachment${files.length > 1 ? "s" : ""}`}
          >
            <Icon name="clip" size={15} />
            {files.length}
          </span>
        )}
        {subtasks.length > 0 && (
          <span
            className={classNames(
              "inline-flex items-center gap-1 tabular-nums",
              {
                "text-(--hue-4)": done === subtasks.length,
              },
            )}
            title={`${done} of ${subtasks.length} subtasks done`}
            aria-label={`${done} of ${subtasks.length} subtasks done`}
          >
            <Icon name="check-circle" size={15} />
            {done}/{subtasks.length}
          </span>
        )}
        {assignee && <Avatar user={assignee} size="sm" className="ml-auto" />}
      </Typography>
    </article>
  );
};

type Props = {
  todo: ToDo;
  landed?: boolean;
  onLanded?: () => void;
  onOpen: () => void;
} & EpicProps;

const ToDoCard = ({ todo, landed, onLanded, onOpen, ...epic }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  return (
    <Card
      todo={todo}
      {...epic}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={classNames({ trace: isDragging, landed })}
      onAnimationEnd={onLanded}
      onClick={onOpen}
      {...listeners}
      {...attributes}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key !== "Enter") return;
        // Otherwise the same Enter submits the modal's form once focus lands in it.
        e.preventDefault();
        onOpen();
      }}
    />
  );
};

export default ToDoCard;
