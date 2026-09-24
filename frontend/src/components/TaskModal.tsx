import { Board } from "@system-types/Board";
import { Column, ColumnId } from "@system-types/column";
import { ToDo } from "@system-types/ToDo";
import { FormEvent, useId, useState } from "react";
import { hashHue, hue } from "../hue";
import Button from "./Button";
import Icon from "./Icon";
import Input from "./Input";
import Modal from "./Modal";
import Select from "./Select";
import Subtasks from "./Subtasks";
import Tag from "./Tag";
import TextArea from "./TextArea";
import Typography from "./Typography";
import EditableTitle from "./EditableTitle";

export type TaskFields = Pick<
  ToDo,
  "title" | "description" | "column" | "due" | "label" | "subtasks"
>;

type Shared = {
  board: Board;
  columns: Column[];
  // Existing labels, suggested in the Label field.
  labels: string[];
  onClose: () => void;
};

const toColumn = (v: string) => Number(v) as unknown as ColumnId;

const Crumbs = ({ board, columns, column }: Shared & { column: ColumnId }) => {
  const i = columns.findIndex((c) => c.id === column);
  return (
    <>
      <Tag icon="board" style={hashHue(String(board.id))}>
        {board.name}
      </Tag>
      <Tag icon="status" style={hue(i + 1)}>
        {columns[i].name}
      </Tag>
    </>
  );
};

const Labels = ({ id, labels }: { id: string; labels: string[] }) => (
  <datalist id={id}>
    {labels.map((l) => (
      <option key={l} value={l} />
    ))}
  </datalist>
);

const columnOptions = (columns: Column[]) =>
  columns.map((c) => ({ value: String(c.id), label: c.name }));

export const NewTaskModal = ({
  onCreate,
  ...shared
}: Shared & { onCreate: (fields: TaskFields) => void }) => {
  const { columns, labels, onClose } = shared;
  const formId = useId();
  const listId = useId();
  const [column, setColumn] = useState(columns[0].id);
  const [error, setError] = useState("");
  const [subtasks, setSubtasks] = useState<ToDo["subtasks"]>([]);
  const isMac = navigator.platform.includes("Mac");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const title = get("title");
    if (!title) {
      setError("Give the task a title.");
      e.currentTarget.querySelector<HTMLInputElement>("[name=title]")?.focus();
      return;
    }
    onCreate({
      title,
      description: get("description"),
      column,
      due: get("due") || undefined,
      label: get("label") || undefined,
      subtasks: subtasks
        .map((st) => ({ ...st, title: st.title.trim() }))
        .filter((st) => st.title),
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      aria-label="New task"
      crumbs={<Crumbs {...shared} column={column} />}
      title={
        <Typography as="h2" variant="headline-sm">
          New task
        </Typography>
      }
      footer={
        <>
          <span className="inline-flex items-center gap-1 max-md:hidden">
            <kbd className="kbd">{isMac ? "⌘" : "Ctrl"}</kbd>
            <kbd className="kbd">Enter</kbd> to create
          </span>
          <span className="flex gap-1.5 ml-auto">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              <Icon name="plus" /> Create task
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
        <Input
          name="title"
          label="Title"
          icon="pen"
          placeholder="What needs doing?"
          maxLength={200}
          autoComplete="off"
          error={error}
          onChange={() => setError("")}
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
          <Input name="due" type="date" label="Due date" icon="cal" optional />
          <Input
            name="label"
            label="Label"
            icon="tag"
            optional
            placeholder="e.g. Design"
            maxLength={24}
            autoComplete="off"
            list={listId}
          />
          <Labels id={listId} labels={labels} />
        </div>
        <TextArea
          name="description"
          label="Notes"
          icon="notes"
          optional
          placeholder="Add context, links or acceptance criteria"
        />
        <Subtasks value={subtasks} onChange={setSubtasks} optional />
      </form>
    </Modal>
  );
};

// Every edit saves immediately, like the wireframe.
export const TaskDetailModal = ({
  todo,
  onChange,
  onDelete,
  ...shared
}: Shared & {
  todo: ToDo;
  onChange: (patch: Partial<TaskFields>) => void;
  onDelete: () => void;
}) => {
  const { columns, labels, onClose } = shared;
  const listId = useId();

  return (
    <Modal
      open
      onClose={onClose}
      aria-label="Task details"
      crumbs={<Crumbs {...shared} column={todo.column} />}
      title={
        <EditableTitle
          aria-label="Title"
          defaultValue={todo.title}
          onChange={(title) => onChange({ title })}
        />
      }
      footer={
        <>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check-circle" style={{ color: "var(--hue-4)" }} />
            Saved automatically
          </span>
          <Button variant="danger" onClick={onDelete}>
            <Icon name="trash" /> Delete task
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
        <Select
          label="Column"
          icon="status"
          value={String(todo.column)}
          onChange={(e) => onChange({ column: toColumn(e.target.value) })}
          options={columnOptions(columns)}
        />
        <Input
          type="date"
          label="Due date"
          icon="cal"
          defaultValue={todo.due}
          onChange={(e) => onChange({ due: e.target.value || undefined })}
        />
        <Input
          label="Label"
          icon="tag"
          placeholder="e.g. Design"
          maxLength={24}
          autoComplete="off"
          list={listId}
          defaultValue={todo.label}
          onChange={(e) =>
            onChange({ label: e.target.value.trim() || undefined })
          }
        />
        <Labels id={listId} labels={labels} />
      </div>
      <TextArea
        label="Notes"
        icon="notes"
        placeholder="Add context, links or acceptance criteria"
        defaultValue={todo.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <Subtasks
        value={todo.subtasks}
        onChange={(subtasks) => onChange({ subtasks })}
      />
    </Modal>
  );
};
