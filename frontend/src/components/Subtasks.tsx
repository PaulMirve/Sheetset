import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  Modifier,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Subtask, SubtaskId } from "@system-types/Subtask";
import classNames from "classnames";
import { KeyboardEvent, ReactNode, useRef, useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import Typography from "./Typography";
import InlineInput from "./InlineInput";
import Checkbox from "./Checkbox";

type Props = {
  value: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  optional?: boolean;
  // "First tasks" of a new epic: dot rows instead of checkboxes, no progress.
  epic?: boolean;
  // Acceptance criteria: same checklist, different words.
  criteria?: boolean;
};

// ponytail: negative ids mark unsaved rows; the backend assigns real ones.
let nextId = -1;

const rowClass =
  "group flex items-center gap-2.5 h-11 pl-3 pr-1.5 rounded-[10px] bg-ground border border-transparent transition-[background-color,border-color,box-shadow] duration-150 hover:border-line-strong focus-within:bg-surface focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--color-primary-wash)]";

const lockX: Modifier = ({ transform }) => ({ ...transform, x: 0 });

// Row that can be dragged by its grip only, so inputs stay clickable.
const SortableRow = ({
  id,
  title,
  word,
  children,
}: {
  id: SubtaskId;
  title: string;
  word: string;
  children: (grip: ReactNode) => ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={classNames(rowClass, {
        "relative z-10 bg-surface! shadow-lift": isDragging,
      })}
    >
      {children(
        <Button
          type="button"
          variant="icon"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${title || word}`}
          className="-mx-1.5 flex-none w-6 cursor-grab touch-none active:cursor-grabbing"
        >
          <Icon name="grip" size={15} />
        </Button>,
      )}
    </div>
  );
};

// Editable checklist: check, rename inline, remove, Enter to add.
const Subtasks = ({ value, onChange, optional, epic, criteria }: Props) => {
  const word = epic ? "task" : criteria ? "criterion" : "subtask";
  const maxLength = criteria ? 500 : 200;
  const legend = epic
    ? "First tasks"
    : criteria
      ? "Acceptance criteria"
      : "Subtasks";
  const addRef = useRef<HTMLInputElement>(null);
  const done = value.filter((st) => st.completed).length;
  const allDone = value.length > 0 && done === value.length;

  const update = (id: SubtaskId, patch: Partial<Subtask>) =>
    onChange(value.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  const remove = (id: SubtaskId, refocus = true) => {
    onChange(value.filter((st) => st.id !== id));
    if (refocus) addRef.current?.focus();
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  // Live region inside the dialog, or screen readers behind aria-modal miss it.
  const [live, setLive] = useState<HTMLElement | null>(null);
  const titleOf = (id: UniqueIdentifier) =>
    value.find((st) => st.id === id)?.title || word;
  const position = (id?: UniqueIdentifier) =>
    `position ${value.findIndex((st) => st.id === id) + 1} of ${value.length}`;

  const reorder = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = value.findIndex((st) => st.id === active.id);
    const to = value.findIndex((st) => st.id === over.id);
    onChange(arrayMove(value, from, to));
  };

  const add = (e: KeyboardEvent<HTMLInputElement>) => {
    // Cmd/Ctrl + Enter falls through to the form's submit shortcut.
    if (e.key !== "Enter" || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); // don't submit the task form
    const title = e.currentTarget.value.trim();
    e.currentTarget.value = "";
    if (!title) return;
    onChange([
      ...value,
      { id: nextId-- as SubtaskId, title, completed: false },
    ]);
  };

  return (
    <fieldset ref={setLive} className="grid gap-1.5 min-w-0">
      <Typography
        as="legend"
        variant="label"
        color="muted"
        className="flex items-center gap-1.5 w-full mb-1.5"
      >
        <Icon
          name={epic ? "layers" : criteria ? "check" : "check-circle"}
          size={15}
        />
        {legend}
        {optional && <span className="font-medium opacity-75">optional</span>}
        {!epic && value.length > 0 && (
          <span
            className={classNames("ml-auto tabular-nums", {
              "text-(--hue-4)": allDone,
            })}
          >
            {done} of {value.length}
          </span>
        )}
      </Typography>
      {!epic && value.length > 0 && (
        <div
          role="progressbar"
          aria-label={`${legend} done`}
          aria-valuemin={0}
          aria-valuemax={value.length}
          aria-valuenow={done}
          className="h-1 mb-1.5 rounded-full bg-line-strong overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-(--hue-4) transition-[width] duration-300 ease-out"
            style={{ width: `${(done / value.length) * 100}%` }}
          />
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[lockX]}
        onDragEnd={reorder}
        accessibility={{
          container: live ?? undefined,
          announcements: {
            onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
            onDragOver: ({ active, over }) =>
              `${titleOf(active.id)} is at ${position(over?.id)}.`,
            onDragEnd: ({ active, over }) =>
              `${titleOf(active.id)} dropped at ${position(over?.id)}.`,
            onDragCancel: ({ active }) =>
              `Moving ${titleOf(active.id)} cancelled.`,
          },
        }}
      >
        <SortableContext
          items={value.map((st) => st.id)}
          strategy={verticalListSortingStrategy}
        >
          {value.map((st) => (
            <SortableRow key={st.id} id={st.id} title={st.title} word={word}>
              {(grip) => (
                <>
                  {epic ? (
                    <span className="size-2 rounded-full flex-none bg-(--h,var(--color-muted))" />
                  ) : (
                    <Checkbox
                      aria-label={`Done: ${st.title}`}
                      checked={st.completed}
                      onChange={(e) =>
                        update(st.id, { completed: e.target.checked })
                      }
                      className="peer"
                    />
                  )}
                  {grip}
                  <InlineInput
                    aria-label={`${word[0].toUpperCase()}${word.slice(1)} title`}
                    value={st.title}
                    maxLength={maxLength}
                    onChange={(e) => update(st.id, { title: e.target.value })}
                    // Emptied rows go away rather than save blank.
                    onBlur={() => !st.title.trim() && remove(st.id, false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        addRef.current?.focus();
                      }
                      if (e.key === "Backspace" && !st.title) {
                        e.preventDefault();
                        remove(st.id);
                      }
                    }}
                    className="peer-checked:text-muted peer-checked:line-through"
                  />
                  <Button
                    type="button"
                    variant="icon"
                    aria-label={`Remove ${st.title || word}`}
                    onClick={() => remove(st.id)}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:text-alert! hover:bg-alert-wash!"
                  >
                    <Icon name="trash" size={15} />
                  </Button>
                </>
              )}
            </SortableRow>
          ))}
        </SortableContext>
      </DndContext>
      <label className={classNames(rowClass, "text-muted cursor-text")}>
        <Icon name="plus" size={18} />
        <InlineInput
          ref={addRef}
          aria-label={`New ${word}`}
          placeholder={`Add a ${word}, press Enter`}
          maxLength={maxLength}
          onKeyDown={add}
        />
      </label>
    </fieldset>
  );
};

export default Subtasks;
