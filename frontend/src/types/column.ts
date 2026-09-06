import { BaseType } from "./base";
import { Brand } from "./Brand";

export type ColumnId = Brand<number, "ColumnId">;

export type Column = {
  id: ColumnId;
  name: string;
  color: string;
} & BaseType;
