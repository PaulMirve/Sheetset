import type { User } from "@system-types/user";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { userKeys } from "./queryKeys";

export const useMe = () =>
  useQuery({ queryKey: userKeys.me(), queryFn: () => api<User>("/me") });
