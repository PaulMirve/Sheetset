import { ColumnId } from "@system-types/column";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { FormEvent, useId, useState } from "react";
import { errorsOf, taskSchema } from "../forms";
import { epicHue, hashHue, hue } from "../hue";
import { BoardView, TaskActions, TaskFields, toColumn, toEpic } from "../tasks";
import Button from "./Button";
import DatePicker from "./DatePicker";
import EditableTitle from "./EditableTitle";
import Icon from "./Icon";
import Input from "./Input";
import Modal from "./Modal";
import RichTextArea from "./RichTextArea";
import Segmented from "./Segmented";
import Select from "./Select";
import Subtasks from "./Subtasks";
import Tag from "./Tag";
import {
  columnOptions,
  EpicSelect,
  Labels,
  notesPlaceholder,
  Source,
  TaskBody,
  TaskProperties,
  useTaskSave,
} from "./TaskParts";
import Typography from "./Typography";

type DialogProps = BoardView & { onClose: () => void };

const Crumbs = ({
  board,
  columns,
  column,
  epicId,
  parent,
  onOpenParent,
  code,
}: DialogProps & {
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
          <Button
            variant="bare"
            title={`Open “${parent.title}”`}
            onClick={onOpenParent}
            className="min-w-0 rounded-full hover:brightness-95"
          >
            <Tag icon="layers" style={epicHue(parent.id)}>
              {parent.title}
            </Tag>
          </Button>
        ) : (
          <Tag icon="layers" style={epicHue(parent.id)}>
            {parent.title}
          </Tag>
        ))}
    </>
  );
};

export const NewTaskModal = ({
  onCreate,
  asEpic = false,
  epic: initialEpic,
  ...shared
}: DialogProps & {
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
            onChange={(v) => setColumn(toColumn(v))}
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
              onChange={(v) => setEpic(toEpic(v))}
            />
          )}
        </div>
        <RichTextArea
          name="description"
          label="Notes"
          icon="notes"
          optional
          placeholder={notesPlaceholder(isEpic)}
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
}: DialogProps &
  TaskActions & {
    todo: ToDo;
    // Open this task on its own page.
    onOpenPage: () => void;
  }) => {
  const { board, columns, labels, todos, onClose } = shared;
  const { errors, save } = useTaskSave(onChange);
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
        <TaskProperties
          todo={todo}
          columns={columns}
          todos={todos}
          labels={labels}
          save={save}
          errors={errors}
        />
      </div>
      <TaskBody
        todo={todo}
        board={board}
        columns={columns}
        todos={todos}
        onOpenTask={onOpenTask}
        onChangeTask={onChangeTask}
        onCreate={onCreate}
        save={save}
        errors={errors}
      />
    </Modal>
  );
};
