// Mirrors backend/app/schemas/board.py.
import { Brand } from "./Brand";
import { Column } from "./column";

export type BoardId = Brand<number, "BoardId">;

export type Board = {
  id: BoardId;
  key: string; // "PLAT" in PLAT-12
  name: string;
  shared: boolean;
  owner_id: number;
  columns: Column[]; // in order
};
