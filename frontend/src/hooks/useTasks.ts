import { ColumnId } from "@system-types/column";
import { SubtaskId } from "@system-types/Subtask";
import { Task } from "@system-types/task";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { TaskFields } from "@components/TaskModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { taskKeys } from "./queryKeys";

// ponytail: assignee isn't mapped until there's an endpoint for board members.
export const toToDo = (t: Task): ToDo => ({
  id: t.id as unknown as ToDoId,
  title: t.title,
  description: t.description,
  column: t.column_id as unknown as ColumnId,
  due: t.due ?? undefined,
  label: t.label ?? undefined,
  subtasks: t.subtasks.map((s) => ({
    id: s.id as unknown as SubtaskId,
    title: s.title,
    completed: s.done,
  })),
  created_at: t.created_at,
  updated_at: t.updated_at,
});

// Only the keys present are sent; a key set to undefined clears that field.
const toBody = (fields: Partial<TaskFields>) => {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === "column") body.column_id = v;
    else if (k === "subtasks")
      body.subtasks = fields
        .subtasks!.filter((s) => s.title.trim())
        .map((s) => ({ title: s.title.trim(), done: s.completed }));
    else body[k] = v ?? null;
  }
  return body;
};

// Every task write runs in order, so fast edits (typing notes) can't land out of order.
const scope = { id: "tasks" };

export const useTasks = (boardId: number) =>
  useQuery({
    queryKey: taskKeys.board(boardId),
    queryFn: async () =>
      (await api<Task[]>(`/boards/${boardId}/tasks`)).map(toToDo),
  });

export const useCreateTask = (boardId: number) => {
  const qc = useQueryClient();
  return useMutation({
    scope,
    mutationFn: async (fields: TaskFields) =>
      toToDo(await api<Task>(`/boards/${boardId}/tasks`, toBody(fields))),
    onSuccess: (todo) =>
      qc.setQueryData(taskKeys.board(boardId), (old?: ToDo[]) =>
        old ? [...old, todo] : old,
      ),
  });
};

type Update = { id: ToDoId; patch: Partial<TaskFields>; position?: number };

// Optimistic: the cache changes right away. The server's copy isn't written back,
// since new subtask ids would remount rows mid-typing.
export const useUpdateTask = (boardId: number) => {
  const qc = useQueryClient();
  const key = taskKeys.board(boardId);
  return useMutation({
    scope,
    mutationFn: ({ id, patch, position }: Update) =>
      api<Task>(`/tasks/${id}`, { ...toBody(patch), position }, "PATCH"),
    onMutate: ({ id, patch }) =>
      qc.setQueryData(key, (old?: ToDo[]) =>
        old?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      ),
    onSuccess: (_, { patch, position }) => {
      // The server renumbered the column.
      if ("column" in patch || position !== undefined)
        qc.invalidateQueries({ queryKey: key });
    },
    onError: () => qc.invalidateQueries({ queryKey: key }),
  });
};

export const useDeleteTask = (boardId: number) => {
  const qc = useQueryClient();
  const key = taskKeys.board(boardId);
  return useMutation({
    scope,
    mutationFn: (id: ToDoId) => api<void>(`/tasks/${id}`, undefined, "DELETE"),
    onMutate: (id) =>
      qc.setQueryData(key, (old?: ToDo[]) => old?.filter((t) => t.id !== id)),
    onError: () => qc.invalidateQueries({ queryKey: key }),
  });
};
