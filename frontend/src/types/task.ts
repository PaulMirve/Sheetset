// Mirrors backend/app/schemas/task.py.

export type TaskFile = {
  id: number;
  name: string;
  type: string; // MIME
  size: number; // bytes
  created_by_id: number;
  created_at: string;
};

// The meeting a task was created from.
export type TaskSource = {
  meeting_id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string | null;
  platform?: string | null;
  url?: string | null;
  who?: string | null;
  at?: string | null; // "00:14"
  quote?: string | null;
};

export type Task = {
  id: number;
  board_id: number;
  number: number;
  column_id: number;
  position: number;
  title: string;
  description: string;
  label: string | null;
  due: string | null; // YYYY-MM-DD
  assignee_id: number | null;
  is_epic: boolean;
  epic_id: number | null;
  source: TaskSource | null;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  subtasks: { id: number; title: string; done: boolean }[];
  files: TaskFile[];
  blocked_by: number[]; // ids of tasks on the same board
};
