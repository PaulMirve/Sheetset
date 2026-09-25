import { Brand } from "./Brand";

export type ColumnId = Brand<number, "ColumnId">;

export type Column = {
  id: ColumnId;
  name: string;
  position: number;
};
