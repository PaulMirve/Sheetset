import { Brand } from "./Brand";
import { ColumnId } from "./column";
import { Subtask } from "./Subtask";
import { TaskFile, TaskSource } from "./task";
import { ToDoStatus } from "./ToDoStatus";
import { User } from "./user";

export type ToDoId = Brand<number, "ToDoId">;

export type ToDo = {
  id: ToDoId;
  // Public id: board key + number, "WON-001". Epics share the board's counter.
  key: string;
  title: string;
  description: string;
  status?: ToDoStatus;
  column: ColumnId;
  due?: string; // YYYY-MM-DD
  label?: string;
  assignee?: User;
  subtasks: Subtask[];
  isEpic: boolean;
  epic?: ToDoId; // the epic this task belongs to
  blockedBy: ToDoId[]; // tasks that have to be done first
  source?: TaskSource;
  files: TaskFile[];
  created_at: string;
  updated_at: string;
};
