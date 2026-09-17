import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToDo } from "@system-types/ToDo";
import classNames from "classnames";
import Icon from "./Icon";

type CardProps = {
  todo: ToDo;
  className?: string;
} & Omit<React.ComponentProps<"article">, "className">;

export const Card = ({ todo, className, ...props }: CardProps) => {
  const { title, description, subtasks } = todo;
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
      <div className="font-[650] text-[15.5px] leading-[1.35] wrap-anywhere">
        {title}
      </div>
      {description && (
        <div className="-mt-1 text-muted text-[14px] line-clamp-2">
          {description}
        </div>
      )}
      {(description || subtasks.length > 0) && (
        <div className="flex items-center gap-2.5 min-h-6 pt-[9px] border-t border-line text-muted text-[13.5px] font-semibold">
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
              title="Subtasks done"
            >
              <Icon name="check-circle" size={15} />
              {done} of {subtasks.length}
            </span>
          )}
        </div>
      )}
    </article>
  );
};

type Props = { todo: ToDo; landed?: boolean; onLanded?: () => void };

const ToDoCard = ({ todo, landed, onLanded }: Props) => {
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
      {...listeners}
      {...attributes}
    />
  );
};

export default ToDoCard;
