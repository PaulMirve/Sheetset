import { User } from "./user";

export type BaseType = {
  created_at: string;
  updated_at: string;
  created_by: User;
  updated_by: User;
};
