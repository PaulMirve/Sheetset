// Mirrors backend/app/schemas/meeting.py.

// A note line, or a section heading when only `h` is set.
export type Note = {
  t?: string | null;
  who?: string | null;
  text?: string | null;
  h?: string | null;
};

export type SuggestedTask = {
  title: string;
  who?: string | null;
  due?: string | null; // YYYY-MM-DD
  label?: string | null;
  src?: number | null; // index into notes
  why: string;
};

export type Meeting = {
  id: number;
  title: string;
  date: string;
  time?: string | null;
  duration?: number | null; // minutes
  platform?: string | null;
  url?: string | null;
  people: string[];
  notes: Note[];
  summary: string;
  decisions: string[];
  tasks: SuggestedTask[];
};

export type MeetingSummary = Pick<
  Meeting,
  "id" | "title" | "date" | "time" | "platform"
> & { task_count: number };
