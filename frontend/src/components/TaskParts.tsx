// Pieces shared by the task dialog (TaskModal) and the task page (TaskPage).
import { Column } from "@system-types/column";
import { TaskSource } from "@system-types/task";
import { ToDo, ToDoId } from "@system-types/ToDo";
import classNames from "classnames";
import { ComponentProps, useId, useState } from "react";
import { fmtDate } from "../dates";
import { errorsOf, taskSchema } from "../forms";
import { hashHue, hue } from "../hue";
import {
  BoardView,
  TaskActions,
  TaskFields,
  canMove,
  doneColumn,
  epicTasksOf,
  newEpicTask,
  toColumn,
  toEpic,
} from "../tasks";
import Button, { button } from "./Button";
import DatePicker from "./DatePicker";
import Checkbox from "./Checkbox";
import Files from "./Files";
import Icon from "./Icon";
import InlineInput from "./InlineInput";
import Input from "./Input";
import RichTextArea from "./RichTextArea";
import Select from "./Select";
import Subtasks from "./Subtasks";
import Tag from "./Tag";
import Typography from "./Typography";

export const Labels = ({ id, labels }: { id: string; labels: string[] }) => (
  <datalist id={id}>
    {labels.map((l) => (
      <option key={l} value={l} />
    ))}
  </datalist>
);

export const notesPlaceholder = (isEpic: boolean) =>
  isEpic
    ? "What is this project, and when is it finished?"
    : "Add context, links or acceptance criteria";

// With a task, columns it can't move to (it's blocked) are disabled.
export const columnOptions = (
  columns: Column[],
  todo?: ToDo,
  todos: ToDo[] = [],
) =>
  columns.map((c) => {
    const disabled = todo ? !canMove(todo, c.id, todos, columns) : false;
    return {
      value: String(c.id),
      label: disabled ? `${c.name} (blocked)` : c.name,
      disabled,
    };
  });

export const EpicSelect = ({
  epics,
  ...props
}: { epics: ToDo[] } & Omit<
  ComponentProps<typeof Select>,
  "label" | "options"
>) => (
  <Select
    label="Epic"
    icon="layers"
    optional
    disabled={!epics.length}
    title={epics.length ? undefined : "This board has no epics yet."}
    {...props}
    options={[
      {
        value: "",
        label: epics.length ? "No epic" : "No epics on this board yet",
      },
      ...epics.map((e) => ({ value: String(e.id), label: e.title })),
    ]}
  />
);

// Only http(s) links open; the API already rejects others, this guards older rows.
const safeUrl = (url?: string | null) =>
  url && /^https?:\/\//i.test(url) ? url : undefined;

/** The meeting a task came from, with the quoted note line. */
export const Source = ({
  source,
  onOpenMeeting,
}: {
  source: TaskSource;
  onOpenMeeting: () => void;
}) => {
  const url = safeUrl(source.url);
  return (
    <section
      aria-label="Source meeting"
      style={hue(3)}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-3.5 rounded-[14px] bg-[color-mix(in_srgb,var(--h)_9%,var(--color-surface))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--h)_22%,transparent)] max-md:grid-cols-[auto_minmax(0,1fr)]"
    >
      <span className="tile size-10 rounded-xl" aria-hidden>
        <Icon name="video" size={20} />
      </span>
      <div className="grid gap-0.5 min-w-0">
        <Typography variant="title">{source.title}</Typography>
        <Typography variant="chip" color="muted">
          {[
            "Created from this meeting",
            fmtDate(source.date),
            source.time,
            source.platform,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
        {source.quote && (
          <Typography
            as="blockquote"
            className="flex gap-2.5 mt-2 py-2 px-3 rounded-[10px] bg-surface"
          >
            {source.at && (
              <Typography
                as="time"
                variant="chip"
                color="muted"
                className="pt-px"
              >
                {source.at}
              </Typography>
            )}
            <span>
              {source.who && (
                <Typography
                  as="b"
                  variant="label"
                  color="inherit"
                  style={hashHue(source.who)}
                  className="text-[color-mix(in_srgb,var(--h)_60%,var(--color-ink))]"
                >
                  {source.who.split(" ")[0]}{" "}
                </Typography>
              )}
              {source.quote}
            </span>
          </Typography>
        )}
      </div>
      <span className="flex gap-1.5 max-md:col-span-full">
        <Button
          variant="secondary"
          onClick={onOpenMeeting}
          className="max-md:flex-1"
        >
          <Icon name="video" size={15} /> Open meeting
        </Button>
        {/* The recording or call on its platform, when the meeting has a link. */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open in ${source.platform ?? "a new tab"}`}
            aria-label={`Open in ${source.platform ?? "a new tab"} (opens in a new tab)`}
            className={button({ variant: "secondary", className: "px-3!" })}
          >
            <Icon name="external" size={15} />
          </a>
        )}
      </span>
    </section>
  );
};

const linkRow =
  "group flex items-center gap-2.5 min-w-0 h-11 pl-3 pr-1.5 rounded-[10px] bg-ground border border-transparent transition-[background-color,border-color,box-shadow] duration-150 hover:border-line-strong focus-within:bg-surface focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--color-primary-wash)]";

/** A linked task (an epic's task, a blocker): its column dot, title to open it, column and a remove button. */
const TaskLinkRow = ({
  todo,
  columns,
  removeLabel,
  removeTitle,
  onOpen,
  onRemove,
}: {
  todo: ToDo;
  columns: Column[];
  // Accessible name and tooltip of the remove button.
  removeLabel: string;
  removeTitle: string;
  onOpen: (id: ToDoId) => void;
  onRemove: () => void;
}) => {
  const columnIndex = columns.findIndex((c) => c.id === todo.column);
  const isDone = todo.column === doneColumn(columns);
  return (
    <div className={linkRow} style={hue(columnIndex + 1)}>
      {isDone ? (
        <Icon name="check" size={16} style={{ color: "var(--hue-4)" }} />
      ) : (
        <span className="size-2 rounded-full flex-none bg-(--h)" />
      )}
      <Button
        variant="bare"
        onClick={() => onOpen(todo.id)}
        className={classNames(
          "flex-1 min-w-0 py-1 text-left truncate hover:underline underline-offset-3 decoration-line-strong",
          { "text-muted line-through": isDone },
        )}
      >
        {todo.title}
      </Button>
      <Tag icon="status" className="flex-none max-md:hidden">
        {columns[columnIndex].name}
      </Tag>
      <Button
        variant="icon"
        aria-label={removeLabel}
        title={removeTitle}
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:text-alert! hover:bg-alert-wash!"
      >
        <Icon name="unlink" size={15} />
      </Button>
    </div>
  );
};

/** "Tasks in this epic": open, unlink, or add one in the epic's column. */
export const EpicTasks = ({
  epic,
  todos,
  columns,
  onOpen,
  onUnlink,
  onAdd,
}: {
  epic: ToDo;
  todos: ToDo[];
  columns: Column[];
  onOpen: (id: ToDoId) => void;
  onUnlink: (id: ToDoId) => void;
  onAdd: (title: string) => void;
}) => {
  const epicTasks = epicTasksOf(epic, todos, columns);
  const done = epicTasks.filter((t) => t.column === doneColumn(columns)).length;
  return (
    <fieldset className="grid gap-1.5 min-w-0">
      <Typography
        as="legend"
        variant="label"
        color="muted"
        className="flex items-center gap-1.5 w-full mb-1.5"
      >
        <Icon name="layers" size={15} />
        Tasks in this epic
        {epicTasks.length > 0 && (
          <span
            className={classNames("ml-auto tabular-nums", {
              "text-(--hue-4)": done === epicTasks.length,
            })}
          >
            {done} of {epicTasks.length}
          </span>
        )}
      </Typography>
      {epicTasks.length > 0 && (
        <div
          role="progressbar"
          aria-label="Tasks done in this epic"
          aria-valuemin={0}
          aria-valuemax={epicTasks.length}
          aria-valuenow={done}
          className="h-1 mb-1.5 rounded-full bg-line-strong overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-(--hue-4) transition-[width] duration-300 ease-out"
            style={{ width: `${(done / epicTasks.length) * 100}%` }}
          />
        </div>
      )}
      {epicTasks.map((t) => (
        <TaskLinkRow
          key={t.id}
          todo={t}
          columns={columns}
          removeLabel={`Remove ${t.title} from this epic`}
          removeTitle="Remove from epic"
          onOpen={onOpen}
          onRemove={() => onUnlink(t.id)}
        />
      ))}
      <label className={classNames(linkRow, "text-muted cursor-text")}>
        <Icon name="plus" size={18} />
        <InlineInput
          aria-label="New task in this epic"
          placeholder="Add a task, press Enter"
          maxLength={200}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.metaKey || e.ctrlKey) return;
            e.preventDefault();
            const title = e.currentTarget.value.trim();
            e.currentTarget.value = "";
            if (title) onAdd(title);
          }}
        />
      </label>
    </fieldset>
  );
};

/** "Blocked by": the tasks this one waits on. Pick one to add, open or remove each. */
export const Blockers = ({
  todo,
  todos,
  columns,
  onOpen,
  onChange,
}: {
  todo: ToDo;
  todos: ToDo[];
  columns: Column[];
  onOpen: (id: ToDoId) => void;
  onChange: (blockedBy: ToDoId[]) => void;
}) => {
  const blockers = todos.filter((t) => todo.blockedBy.includes(t.id));
  const choices = todos.filter(
    (t) => t.id !== todo.id && !todo.blockedBy.includes(t.id),
  );
  return (
    <div className="grid gap-1.5">
      <Select
        label="Blocked by"
        icon="lock"
        optional
        value=""
        disabled={!choices.length}
        onChange={(v) => onChange([...todo.blockedBy, Number(v) as ToDoId])}
        options={[
          {
            value: "",
            label: choices.length
              ? "Add a task this waits on"
              : "No other tasks on this board",
          },
          ...choices.map((t) => ({
            value: String(t.id),
            hint: t.key,
            label: t.title,
          })),
        ]}
      />
      {blockers.map((b) => (
        <TaskLinkRow
          key={b.id}
          todo={b}
          columns={columns}
          removeLabel={`${b.title} no longer blocks this`}
          removeTitle="Remove blocker"
          onOpen={onOpen}
          onRemove={() => onChange(todo.blockedBy.filter((id) => id !== b.id))}
        />
      ))}
    </div>
  );
};

type Save = ReturnType<typeof useTaskSave>;

// Invalid edits aren't saved; the field shows why until it's fixed.
export const useTaskSave = (onChange: (patch: Partial<TaskFields>) => void) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (patch: Partial<TaskFields>) => {
    const r = taskSchema.partial().safeParse(patch);
    const keys = Object.keys(patch);
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return r.success ? next : { ...next, ...errorsOf(r.error) };
    });
    if (r.success) onChange(r.data);
  };
  return { errors, save };
};

/** Column, due date, label and epic of an existing task. Every edit saves. */
export const TaskProperties = ({
  todo,
  columns,
  todos,
  labels,
  save,
  errors,
}: { todo: ToDo } & Pick<BoardView, "columns" | "todos" | "labels"> & Save) => {
  const listId = useId();
  const epics = todos.filter((t) => t.isEpic && t.id !== todo.id);
  return (
    <>
      <Select
        label="Column"
        icon="status"
        value={String(todo.column)}
        onChange={(v) => save({ column: toColumn(v) })}
        options={columnOptions(columns, todo, todos)}
      />
      <DatePicker
        label="Due date"
        icon="cal"
        optional
        value={todo.due ?? ""}
        error={errors.due}
        onChange={(due) => save({ due: due || undefined })}
      />
      <Input
        label="Label"
        icon="tag"
        placeholder="e.g. Design"
        maxLength={24}
        autoComplete="off"
        list={listId}
        defaultValue={todo.label}
        error={errors.label}
        onChange={(e) => save({ label: e.target.value.trim() || undefined })}
      />
      <Labels id={listId} labels={labels} />
      {!todo.isEpic && (
        <EpicSelect
          epics={epics}
          value={todo.epic ? String(todo.epic) : ""}
          onChange={(v) => save({ epic: toEpic(v) })}
        />
      )}
      <div
        role="group"
        aria-label="Flags"
        className="col-span-full flex flex-wrap items-center gap-x-6 gap-y-2"
      >
        <Checkbox
          label="Blocked"
          checked={todo.isBlocked}
          onChange={(e) => save({ isBlocked: e.target.checked })}
        />
        <Checkbox
          label="Needs human review"
          checked={todo.needsHumanReview}
          onChange={(e) => save({ needsHumanReview: e.target.checked })}
        />
      </div>
    </>
  );
};

/** Notes, an epic's tasks or a task's subtasks, blockers and files of an existing task. */
export const TaskBody = ({
  todo,
  board,
  columns,
  todos,
  onOpenTask,
  onChangeTask,
  onCreate,
  save,
  errors,
  notesClassName,
}: { todo: ToDo; notesClassName?: string } & Omit<BoardView, "labels"> &
  Pick<TaskActions, "onOpenTask" | "onChangeTask" | "onCreate"> &
  Save) => (
  <>
    <RichTextArea
      label={todo.isEpic ? "About this epic" : "Notes"}
      icon="notes"
      placeholder={notesPlaceholder(todo.isEpic)}
      defaultValue={todo.description}
      onChange={(description) => save({ description })}
      className={notesClassName}
    />
    {todo.isEpic ? (
      <EpicTasks
        epic={todo}
        todos={todos}
        columns={columns}
        onOpen={onOpenTask}
        onUnlink={(id) => onChangeTask(id, { epic: undefined })}
        onAdd={(title) => onCreate(newEpicTask(todo, title))}
      />
    ) : (
      <Subtasks
        value={todo.subtasks}
        onChange={(subtasks) => save({ subtasks })}
      />
    )}
    {errors.subtasks && (
      <Typography as="p" role="alert" color="alert">
        {errors.subtasks}
      </Typography>
    )}
    <Blockers
      todo={todo}
      todos={todos}
      columns={columns}
      onOpen={onOpenTask}
      onChange={(blockedBy) => save({ blockedBy })}
    />
    <Files boardId={board.id} todo={todo} />
  </>
);
