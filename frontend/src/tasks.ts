// Task rules shared by the board, the task dialog and the task page. Mirrors the API.
import { Board } from "@system-types/Board";
import { Column, ColumnId, WorkflowCode } from "@system-types/column";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { localDay } from "./dates";

/** What the task forms edit and the API hooks send. */
export type TaskFields = Pick<
  ToDo,
  "title" | "description" | "column" | "due" | "label" | "subtasks" | "epic"
> & {
  isEpic?: boolean;
  blockedBy?: ToDoId[];
  isBlocked?: boolean;
  needsHumanReview?: boolean;
};

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

/** Completion is explicit and does not depend on names or array order. */
export const doneColumn = (columns: Column[]): ColumnId | undefined =>
  columns.find((c) => c.code === "done")?.id;

const workflowOrder: Record<WorkflowCode, number> = {
  todo: 0,
  doing: 1,
  code_review: 2,
  ready_for_qa: 3,
  done: 4,
};

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
  const from = columns.find((c) => c.id === todo.column);
  const to = columns.find((c) => c.id === column);
  if (!from || !to) return false;
  return (
    workflowOrder[to.code] <= workflowOrder[from.code] ||
    (!todo.isBlocked &&
      !todo.needsHumanReview &&
      !waitingOn(todo, todos, columns).length)
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

/** Where an epic stands, worked out from its tasks. The epic's own column is ignored. */
export type EpicStatus = "attention" | "progress" | "todo" | "done";

export const epicStats = (epic: ToDo, todos: ToDo[], columns: Column[]) => {
  const tasks = epicTasksOf(epic, todos, columns);
  const doneId = doneColumn(columns);
  const todoId = columns.find((c) => c.code === "todo")?.id;
  const open = tasks.filter((t) => t.column !== doneId);
  const today = localDay();
  const blocked = open.filter(
    (t) => t.isBlocked || waitingOn(t, todos, columns).length > 0,
  ).length;
  const review = open.filter((t) => t.needsHumanReview).length;
  const overdue = open.filter((t) => t.due && t.due < today).length;
  const finished = tasks.length > 0 && open.length === 0;
  const late = !finished && !!epic.due && epic.due < today;
  const status: EpicStatus = finished
    ? "done"
    : blocked || review || overdue || late
      ? "attention"
      : open.every((t) => t.column === todoId)
        ? "todo"
        : "progress";
  return {
    tasks,
    done: tasks.length - open.length,
    blocked,
    review,
    overdue,
    late,
    status,
  };
};
