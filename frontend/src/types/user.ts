import { Brand } from "./Brand";

export type UserId = Brand<number, "UserId">;

export type User = {
  id: UserId;
  email: string;
  first_name: string;
  last_name: string;
};
