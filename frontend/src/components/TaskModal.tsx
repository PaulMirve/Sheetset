import { Board } from "@system-types/Board";
import { Column, ColumnId } from "@system-types/column";
import { TaskSource } from "@system-types/task";
import { ToDo, ToDoId } from "@system-types/ToDo";
import classNames from "classnames";
import { ComponentProps, FormEvent, useId, useState } from "react";
import { errorsOf, taskSchema } from "../forms";
import { epicHue, hashHue, hue } from "../hue";
import Button, { button } from "./Button";
import DatePicker from "./DatePicker";
import EditableTitle from "./EditableTitle";
import Files from "./Files";
import Icon from "./Icon";
import InlineInput from "./InlineInput";
import Input from "./Input";
import Modal from "./Modal";
import Segmented from "./Segmented";
import Select from "./Select";
import Subtasks from "./Subtasks";
import Tag from "./Tag";
import TextArea from "./TextArea";
import Typography from "./Typography";

export type TaskFields = Pick<
  ToDo,
  "title" | "description" | "column" | "due" | "label" | "subtasks" | "epic"
> & { isEpic?: boolean };

type Shared = {
  board: Board;
  columns: Column[];
  // Every task on the board, for the epic picker and an epic's task list.
  todos: ToDo[];
  // Existing labels, suggested in the Label field.
  labels: string[];
  onClose: () => void;
};

export const toColumn = (v: string) => Number(v) as unknown as ColumnId;

const Crumbs = ({
  board,
  columns,
  column,
  epicId,
  parent,
  onOpenParent,
  code,
}: Shared & {
  // The task's public id, once it exists.
  code?: string;
  column: ColumnId;
  // Set when the dialog shows an epic.
  epicId?: ToDoId;
  parent?: ToDo;
  onOpenParent?: () => void;
}) => {
  const i = columns.findIndex((c) => c.id === column);
  return (
    <>
      <Tag icon="board" style={hashHue(String(board.id))}>
        {board.name}
      </Tag>
      {code && <Tag>{code}</Tag>}
      <Tag icon="status" style={hue(i + 1)}>
        {columns[i].name}
      </Tag>
      {epicId && (
        <Tag icon="layers" style={epicHue(epicId)}>
          Epic
        </Tag>
      )}
      {parent &&
        (onOpenParent ? (
          <button
            type="button"
            title={`Open “${parent.title}”`}
            onClick={onOpenParent}
            className="min-w-0 rounded-full hover:brightness-95"
          >
            <Tag icon="layers" style={epicHue(parent.id)}>
              {parent.title}
            </Tag>
          </button>
        ) : (
          <Tag icon="layers" style={epicHue(parent.id)}>
            {parent.title}
          </Tag>
        ))}
    </>
  );
};

export const Labels = ({ id, labels }: { id: string; labels: string[] }) => (
  <datalist id={id}>
    {labels.map((l) => (
      <option key={l} value={l} />
    ))}
  </datalist>
);

export const columnOptions = (columns: Column[]) =>
  columns.map((c) => ({ value: String(c.id), label: c.name }));

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

export const toEpic = (v: string) => (v ? (Number(v) as ToDoId) : undefined);

/** The meeting a task came from, with the quoted note line. */
export const Source = ({
  source,
  onOpenMeeting,
}: {
  source: TaskSource;
  onOpenMeeting: () => void;
}) => (
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
          new Date(`${source.date}T00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
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
      {source.url && (
        <a
          href={source.url}
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
  const last = columns.length > 1 ? columns[columns.length - 1].id : null;
  // Board order: by column, then position.
  const kids = columns.flatMap((c) =>
    todos.filter((t) => t.epic === epic.id && t.column === c.id),
  );
  const done = kids.filter((k) => k.column === last).length;
  const row =
    "group flex items-center gap-2.5 h-11 pl-3 pr-1.5 rounded-[10px] bg-ground border border-transparent transition-[background-color,border-color,box-shadow] duration-150 hover:border-line-strong focus-within:bg-surface focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--color-primary-wash)]";
  return (
    <fieldset className="grid gap-1.5">
      <Typography
        as="legend"
        variant="label"
        color="muted"
        className="flex items-center gap-1.5 w-full mb-1.5"
      >
        <Icon name="layers" size={15} />
        Tasks in this epic
        {kids.length > 0 && (
          <span
            className={classNames("ml-auto tabular-nums", {
              "text-(--hue-4)": done === kids.length,
            })}
          >
            {done} of {kids.length}
          </span>
        )}
      </Typography>
      {kids.length > 0 && (
        <div
          role="progressbar"
          aria-label="Tasks done in this epic"
          aria-valuemin={0}
          aria-valuemax={kids.length}
          aria-valuenow={done}
          className="h-1 mb-1.5 rounded-full bg-line-strong overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-(--hue-4) transition-[width] duration-300 ease-out"
            style={{ width: `${(done / kids.length) * 100}%` }}
          />
        </div>
      )}
      {kids.map((k) => {
        const ci = columns.findIndex((c) => c.id === k.column);
        const isDone = k.column === last;
        return (
          <div key={k.id} className={row} style={hue(ci + 1)}>
            {isDone ? (
              <Icon name="check" size={16} style={{ color: "var(--hue-4)" }} />
            ) : (
              <span className="size-2 rounded-full flex-none bg-(--h)" />
            )}
            <button
              type="button"
              onClick={() => onOpen(k.id)}
              className={classNames(
                "flex-1 min-w-0 py-1 text-left truncate hover:underline underline-offset-3 decoration-line-strong",
                { "text-muted line-through": isDone },
              )}
            >
              {k.title}
            </button>
            <Tag icon="status" className="flex-none max-md:hidden">
              {columns[ci].name}
            </Tag>
            <Button
              type="button"
              variant="icon"
              aria-label={`Remove ${k.title} from this epic`}
              title="Remove from epic"
              onClick={() => onUnlink(k.id)}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:text-alert! hover:bg-alert-wash!"
            >
              <Icon name="unlink" size={15} />
            </Button>
          </div>
        );
      })}
      <label className={classNames(row, "text-muted cursor-text")}>
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

export const NewTaskModal = ({
  onCreate,
  asEpic = false,
  epic: initialEpic,
  ...shared
}: Shared & {
  onCreate: (fields: TaskFields) => Promise<void>;
  // Open in epic mode (board menu → New epic).
  asEpic?: boolean;
  // Preselect this epic (an epic's "Add task").
  epic?: ToDoId;
}) => {
  const { columns, labels, todos, onClose } = shared;
  const formId = useId();
  const listId = useId();
  const [isEpic, setIsEpic] = useState(asEpic);
  const [epic, setEpic] = useState(initialEpic);
  const [column, setColumn] = useState(
    todos.find((t) => t.id === initialEpic)?.column ?? columns[0].id,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [subtasks, setSubtasks] = useState<ToDo["subtasks"]>([]);
  const epics = todos.filter((t) => t.isEpic);
  const kind = isEpic ? "epic" : "task";
  const isMac = navigator.platform.includes("Mac");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const r = taskSchema.safeParse({
      title: get("title"),
      description: get("description"),
      column,
      due: get("due") || undefined,
      label: get("label") || undefined,
      isEpic,
      epic: isEpic ? undefined : epic,
      subtasks: subtasks
        .map((st) => ({ ...st, title: st.title.trim() }))
        .filter((st) => st.title),
    });
    if (!r.success) {
      const errs = errorsOf(r.error);
      if (errs.title && isEpic) errs.title = "Give the epic a name.";
      setErrors(errs);
      // Subtasks have no single field; their message goes to the footer.
      if (errs.subtasks) setSaveError(errs.subtasks);
      form
        .querySelector<HTMLElement>(
          Object.keys(errs)
            .map((k) => `[name=${k}]`)
            .join(","),
        )
        ?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError("");
    try {
      await onCreate(r.data);
      onClose();
    } catch (err) {
      // Keep the dialog open so nothing typed is lost.
      setSaveError(`Couldn’t create the ${kind}: ${(err as Error).message}`);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={`New ${kind}`}
      crumbs={
        <Crumbs
          {...shared}
          column={column}
          parent={isEpic ? undefined : epics.find((e) => e.id === epic)}
        />
      }
      title={
        <Typography as="h2" variant="headline-sm">
          New {kind}
        </Typography>
      }
      footer={
        <>
          {saveError ? (
            <Typography as="p" role="alert" color="alert">
              {saveError}
            </Typography>
          ) : (
            <span className="inline-flex items-center gap-1 max-md:hidden">
              <kbd className="kbd">{isMac ? "⌘" : "Ctrl"}</kbd>
              <kbd className="kbd">Enter</kbd> to create
            </span>
          )}
          <span className="flex gap-1.5 ml-auto">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={saving}>
              <Icon name="plus" /> Create {kind}
            </Button>
          </span>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.currentTarget.requestSubmit();
          }
        }}
        className="contents"
      >
        <Segmented
          label="What are you creating?"
          value={kind}
          onChange={(v) => setIsEpic(v === "epic")}
          options={[
            { value: "task", label: "Task", icon: "board" },
            { value: "epic", label: "Epic", icon: "layers" },
          ]}
        />
        <Input
          name="title"
          label={isEpic ? "Epic name" : "Title"}
          icon="pen"
          placeholder={isEpic ? "What is the project?" : "What needs doing?"}
          maxLength={200}
          autoComplete="off"
          error={errors.title}
          onChange={() => setErrors((e) => ({ ...e, title: "" }))}
          data-autofocus
        />
        <div className="grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
          <Select
            name="column"
            label="Column"
            icon="status"
            value={String(column)}
            onChange={(e) => setColumn(toColumn(e.target.value))}
            options={columnOptions(columns)}
          />
          <DatePicker
            name="due"
            label="Due date"
            icon="cal"
            optional
            error={errors.due}
          />
          <Input
            name="label"
            label="Label"
            icon="tag"
            optional
            placeholder="e.g. Design"
            maxLength={24}
            autoComplete="off"
            list={listId}
            error={errors.label}
          />
          <Labels id={listId} labels={labels} />
          {!isEpic && epics.length > 0 && (
            <EpicSelect
              epics={epics}
              value={epic ? String(epic) : ""}
              onChange={(e) => setEpic(toEpic(e.target.value))}
            />
          )}
        </div>
        <TextArea
          name="description"
          label="Notes"
          icon="notes"
          optional
          placeholder={
            isEpic
              ? "What is this project, and when is it finished?"
              : "Add context, links or acceptance criteria"
          }
        />
        <div
          style={
            isEpic
              ? hue(columns.findIndex((c) => c.id === column) + 1)
              : undefined
          }
        >
          <Subtasks
            value={subtasks}
            onChange={setSubtasks}
            optional
            epic={isEpic}
          />
        </div>
      </form>
    </Modal>
  );
};

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

// Every edit saves immediately, like the wireframe.
export const TaskDetailModal = ({
  todo,
  onChange,
  onDelete,
  onOpenTask,
  onChangeTask,
  onCreate,
  onOpenMeeting,
  onOpenPage,
  ...shared
}: Shared & {
  todo: ToDo;
  // Open this task on its own page.
  onOpenPage: () => void;
  onChange: (patch: Partial<TaskFields>) => void;
  onDelete: () => void;
  // Open another task in this dialog (the parent epic, or one of an epic's tasks).
  onOpenTask: (id: ToDoId) => void;
  // Edit another task (unlink it from this epic).
  onChangeTask: (id: ToDoId, patch: Partial<TaskFields>) => void;
  onCreate: (fields: TaskFields) => Promise<void>;
  // Show the meeting this task came from.
  onOpenMeeting: (meetingId: number) => void;
}) => {
  const { board, columns, labels, todos, onClose } = shared;
  const listId = useId();
  const { errors, save } = useTaskSave(onChange);
  const epics = todos.filter((t) => t.isEpic && t.id !== todo.id);
  const parent = todos.find((t) => t.isEpic && t.id === todo.epic);
  const kind = todo.isEpic ? "epic" : "task";

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={todo.isEpic ? "Epic details" : "Task details"}
      actions={
        <Button
          variant="icon"
          aria-label="Open full page"
          title="Open full page"
          onClick={onOpenPage}
        >
          <Icon name="expand" />
        </Button>
      }
      crumbs={
        <Crumbs
          {...shared}
          code={todo.key}
          column={todo.column}
          epicId={todo.isEpic ? todo.id : undefined}
          parent={parent}
          onOpenParent={() => parent && onOpenTask(parent.id)}
        />
      }
      title={
        <EditableTitle
          aria-label={todo.isEpic ? "Epic name" : "Title"}
          defaultValue={todo.title}
          onChange={(title) => save({ title })}
        />
      }
      footer={
        <>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check-circle" style={{ color: "var(--hue-4)" }} />
            Saved automatically
          </span>
          <Button variant="danger" onClick={onDelete}>
            <Icon name="trash" /> Delete {kind}
          </Button>
        </>
      }
    >
      {todo.source && (
        <Source
          source={todo.source}
          onOpenMeeting={() => onOpenMeeting(todo.source!.meeting_id)}
        />
      )}
      <div className="grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
        <Select
          label="Column"
          icon="status"
          value={String(todo.column)}
          onChange={(e) => save({ column: toColumn(e.target.value) })}
          options={columnOptions(columns)}
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
            onChange={(e) => save({ epic: toEpic(e.target.value) })}
          />
        )}
      </div>
      <TextArea
        label={todo.isEpic ? "About this epic" : "Notes"}
        icon="notes"
        placeholder={
          todo.isEpic
            ? "What is this project, and when is it finished?"
            : "Add context, links or acceptance criteria"
        }
        defaultValue={todo.description}
        onChange={(e) => save({ description: e.target.value })}
      />
      {todo.isEpic ? (
        <EpicTasks
          epic={todo}
          todos={todos}
          columns={columns}
          onOpen={onOpenTask}
          onUnlink={(id) => onChangeTask(id, { epic: undefined })}
          onAdd={(title) =>
            onCreate({
              title,
              description: "",
              column: todo.column,
              epic: todo.id,
              subtasks: [],
            })
          }
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
      <Files boardId={board.id} todo={todo} />
    </Modal>
  );
};
