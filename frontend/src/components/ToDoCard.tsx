import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToDo } from "@system-types/ToDo";
import classNames from "classnames";
import Icon from "./Icon";
import Tag from "./Tag";
import { hashHue, hue } from "../hue";
import Typography from "./Typography";

const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
};

// Overdue → alert red, due within 2 days → amber, else neutral.
export const DueTag = ({ due }: { due: string }) => {
  const late = due < day();
  const soon = !late && due <= day(2);
  const date = new Date(`${due}T00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

type CardProps = {
  todo: ToDo;
  className?: string;
} & Omit<React.ComponentProps<"article">, "className">;

export const Card = ({ todo, className, ...props }: CardProps) => {
  const { title, description, subtasks, label, due } = todo;
  const done = subtasks.filter((st) => st.completed).length;
  return (
    <article
      aria-label={title}
      className={classNames(
        "grid gap-2.5 pt-3 px-3 pb-[11px] bg-surface rounded-xl shadow-rest cursor-grab transition-[box-shadow,transform,opacity] duration-200 ease-out hover:shadow-lift hover:-translate-y-px",
        className,
      )}
      {...props}
    >
      <Typography variant="title" className="wrap-anywhere">
        {title}
      </Typography>
      {description && (
        <Typography color="muted" className="-mt-1 line-clamp-2">
          {description}
        </Typography>
      )}
      {(label || due) && (
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {label && (
            <Tag dot style={hashHue(label)} className="max-w-full">
              {label}
            </Tag>
          )}
          {due && <DueTag due={due} />}
        </div>
      )}
      {(description || subtasks.length > 0) && (
        <Typography
          variant="chip"
          color="muted"
          className="flex items-center gap-2.5 min-h-6 pt-[9px] border-t border-line"
        >
          {description && (
            <span title="Has notes" className="inline-flex">
              <Icon name="notes" size={15} />
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
        </Typography>
      )}
    </article>
  );
};

type Props = {
  todo: ToDo;
  landed?: boolean;
  onLanded?: () => void;
  onOpen: () => void;
};

const ToDoCard = ({ todo, landed, onLanded, onOpen }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id as unknown as number });

  return (
    <Card
      todo={todo}
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
