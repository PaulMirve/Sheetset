// Mirrors backend/app/schemas/task.py.

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
  created_by_id: number;
  created_at: string;
  updated_at: string;
  subtasks: { id: number; title: string; done: boolean }[];
};
