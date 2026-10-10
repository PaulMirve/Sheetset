import { Brand } from "./Brand";

export type ColumnId = Brand<number, "ColumnId">;

export type WorkflowCode =
  "todo" | "doing" | "code_review" | "ready_for_qa" | "done";

export type Column = {
  id: ColumnId;
  name: string;
  code: WorkflowCode;
  position: number;
};
