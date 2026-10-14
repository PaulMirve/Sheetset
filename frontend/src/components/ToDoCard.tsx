import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToDo } from "@system-types/ToDo";
import classNames from "classnames";
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

type EpicProps = {
  // The epic this task belongs to.
  parent?: ToDo;
  // Tasks this one waits on that aren't done yet.
  blockers?: ToDo[];
  // Clicking the epic chip opens the epic's board.
  onOpenEpic?: () => void;
};

type CardProps = {
  todo: ToDo;
  className?: string;
} & EpicProps &
  Omit<React.ComponentProps<"article">, "className">;

export const Card = ({
  todo,
  className,
  parent,
  blockers = [],
  onOpenEpic,
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
          {parent &&
            (onOpenEpic ? (
              // Its clicks stay here, so they don't open or drag the card.
              <Button
                variant="bare"
                title={`Open the “${parent.title}” epic`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEpic();
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="min-w-0 max-w-full rounded-full hover:brightness-95"
              >
                <Tag
                  icon="layers"
                  style={epicHue(parent.id)}
                  className="max-w-full"
                >
                  {parent.title}
                </Tag>
              </Button>
            ) : (
              <Tag
                icon="layers"
                style={epicHue(parent.id)}
                className="max-w-full"
                title={`Part of “${parent.title}”`}
              >
                {parent.title}
              </Tag>
            ))}
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
