import { BaseType } from "./base";
import { Brand } from "./Brand";

export type SubtaskId = Brand<number, "SubtaskId">;

export type Subtask = {
  id: SubtaskId;
  title: string;
  completed: boolean;
} & BaseType;
