import { Brand } from "./Brand";

export type BoardId = Brand<number, "BoardId">;

export type Board = {
  id: BoardId;
  name: string;
};
