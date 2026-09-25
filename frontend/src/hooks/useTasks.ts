import { Board } from "@system-types/Board";
import { ColumnId } from "@system-types/column";
import { SubtaskId } from "@system-types/Subtask";
import { Task, TaskFile } from "@system-types/task";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { TaskFields } from "@components/TaskModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob } from "../api";
import { taskKeys } from "./queryKeys";

// ponytail: assignee isn't mapped until there's an endpoint for board members.
export const toToDo = (t: Task, boardKey: string): ToDo => ({
  id: t.id as unknown as ToDoId,
  key: `${boardKey}-${String(t.number).padStart(3, "0")}`,
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
  isEpic: t.is_epic,
  epic: (t.epic_id ?? undefined) as ToDoId | undefined,
  source: t.source ?? undefined,
  files: t.files,
  created_at: t.created_at,
  updated_at: t.updated_at,
});

// Only the keys present are sent; a key set to undefined clears that field.
const toBody = (fields: Partial<TaskFields>) => {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === "column") body.column_id = v;
    else if (k === "isEpic") body.is_epic = v;
    else if (k === "epic") body.epic_id = v ?? null;
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

export const useTasks = ({ id, key }: Board) =>
  useQuery({
    queryKey: taskKeys.board(id),
    queryFn: async () =>
      (await api<Task[]>(`/boards/${id}/tasks`)).map((t) => toToDo(t, key)),
  });

export const useCreateTask = ({ id: boardId, key }: Board) => {
  const qc = useQueryClient();
  return useMutation({
    scope,
    mutationFn: async (fields: TaskFields) =>
      toToDo(await api<Task>(`/boards/${boardId}/tasks`, toBody(fields)), key),
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

export const MAX_FILE = 10 * 1024 * 1024;

// Uploads one at a time and adds each to the task's card as it lands.
export const useUploadFiles = (boardId: number, id: ToDoId) => {
  const qc = useQueryClient();
  const key = taskKeys.board(boardId);
  return useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const name =
          file.name || `Pasted image ${new Date().toLocaleTimeString()}.png`;
        const f = await api<TaskFile>(
          `/tasks/${id}/files?name=${encodeURIComponent(name)}`,
          file,
        );
        qc.setQueryData(key, (old?: ToDo[]) =>
          old?.map((t) => (t.id === id ? { ...t, files: [...t.files, f] } : t)),
        );
      }
    },
  });
};

export const useDeleteFile = (boardId: number, id: ToDoId) => {
  const qc = useQueryClient();
  const key = taskKeys.board(boardId);
  return useMutation({
    mutationFn: (fileId: number) =>
      api<void>(`/files/${fileId}`, undefined, "DELETE"),
    onMutate: (fileId) =>
      qc.setQueryData(key, (old?: ToDo[]) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, files: t.files.filter((f) => f.id !== fileId) }
            : t,
        ),
      ),
    onError: () => qc.invalidateQueries({ queryKey: key }),
  });
};

// Files need the session header, so they're fetched once and shown through an object URL.
// ponytail: object URLs are never revoked; fine for a session's worth of photos.
export const fileUrlQuery = (fileId: number) => ({
  queryKey: [...taskKeys.all, "file", fileId],
  queryFn: async () => URL.createObjectURL(await apiBlob(`/files/${fileId}`)),
  staleTime: Infinity,
  gcTime: Infinity,
});

export const useFileUrl = (fileId: number) => useQuery(fileUrlQuery(fileId));
