// Task rules shared by the board, the task dialog and the task page. Mirrors the API.
import { Board } from "@system-types/Board";
import { Column, ColumnId } from "@system-types/column";
import { ToDo, ToDoId } from "@system-types/ToDo";

/** What the task forms edit and the API hooks send. */
export type TaskFields = Pick<
  ToDo,
  "title" | "description" | "column" | "due" | "label" | "subtasks" | "epic"
> & { isEpic?: boolean; blockedBy?: ToDoId[] };

/** One board as the task screens see it: its columns, every task on it, and the labels in use. */
export type BoardView = {
  board: Board;
  columns: Column[];
  todos: ToDo[];
  labels: string[];
};

/** What a task screen can do besides editing its own task. */
export type TaskActions = {
  onChange: (patch: Partial<TaskFields>) => void;
  // Edit another task (unlink it from this epic).
  onChangeTask: (id: ToDoId, patch: Partial<TaskFields>) => void;
  onCreate: (fields: TaskFields) => Promise<void>;
  // Open another task (the parent epic, one of an epic's tasks, a blocker).
  onOpenTask: (id: ToDoId) => void;
  // Show the meeting a task came from.
  onOpenMeeting: (meetingId: number) => void;
  onDelete: () => void;
};

/** The last column counts as done, once there's more than one. Mirrors Board.done_column_id. */
export const doneColumn = (columns: Column[]): ColumnId | undefined =>
  columns.length > 1 ? columns[columns.length - 1].id : undefined;

export const toColumn = (v: string) => Number(v) as ColumnId;
export const toEpic = (v: string) => (v ? (Number(v) as ToDoId) : undefined);

/** Blockers of `todo` that aren't done yet. */
export const waitingOn = (todo: ToDo, todos: ToDo[], columns: Column[]) => {
  const done = doneColumn(columns);
  return todos.filter(
    (t) => todo.blockedBy.includes(t.id) && t.column !== done,
  );
};

/** Whether `todo` may move to `column`: never right of where it is while blocked. */
export const canMove = (
  todo: ToDo,
  column: ColumnId,
  todos: ToDo[],
  columns: Column[],
) => {
  const at = (id: ColumnId) => columns.findIndex((c) => c.id === id);
  return (
    at(column) <= at(todo.column) || !waitingOn(todo, todos, columns).length
  );
};

/** An epic's tasks in board order: by column, then position. */
export const epicTasksOf = (epic: ToDo, todos: ToDo[], columns: Column[]) =>
  columns.flatMap((c) =>
    todos.filter((t) => t.epic === epic.id && t.column === c.id),
  );

/** A new task in `epic`, in the epic's column. */
export const newEpicTask = (epic: ToDo, title: string): TaskFields => ({
  title,
  description: "",
  column: epic.column,
  epic: epic.id,
  subtasks: [],
});
