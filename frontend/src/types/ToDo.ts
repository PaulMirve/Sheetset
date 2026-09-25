import { Brand } from "./Brand";
import { ColumnId } from "./column";
import { Subtask } from "./Subtask";
import { ToDoStatus } from "./ToDoStatus";
import { User } from "./user";

export type ToDoId = Brand<number, "ToDoId">;

export type ToDo = {
  id: ToDoId;
  title: string;
  description: string;
  status?: ToDoStatus;
  column: ColumnId;
  due?: string; // YYYY-MM-DD
  label?: string;
  assignee?: User;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};
