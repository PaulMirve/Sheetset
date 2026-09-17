import { BaseType } from "./base";
import { Brand } from "./Brand";
import { ColumnId } from "./column";
import { Subtask } from "./Subtask";
import { ToDoStatus } from "./ToDoStatus";

export type ToDoId = Brand<number, "ToDoId">;

export type ToDo = {
  id: ToDoId;
  title: string;
  description: string;
  status?: ToDoStatus;
  column: ColumnId;
  due?: string; // YYYY-MM-DD
  label?: string;
  subtasks: Subtask[];
} & BaseType;
