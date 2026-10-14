import { describe, expect, it } from "vitest";
import type { Task } from "../types/task";
import { toToDo } from "./useTasks";

const apiTask = (patch: Partial<Task> = {}): Task => ({
  id: 1,
  board_id: 1,
  number: 4,
  column_id: 1,
  position: 0,
  title: "Task",
  description: "",
  label: null,
  due: null,
  assignee_id: null,
  is_epic: false,
  is_blocked: false,
  needs_human_review: false,
  epic_id: null,
  source: null,
  created_by_id: 1,
  created_at: "2026-10-09",
  updated_at: "2026-10-09",
  subtasks: [],
  files: [],
  blocked_by: [],
  ...patch,
});

describe("toToDo", () => {
  // The epic board's Mine filter matches on this; it was dropped before.
  it("keeps the assignee's id", () => {
    expect(toToDo(apiTask({ assignee_id: 7 }), "APP").assigneeId).toBe(7);
    expect(toToDo(apiTask(), "APP").assigneeId).toBeUndefined();
  });

  it("pads the public key", () => {
    expect(toToDo(apiTask(), "APP").key).toBe("APP-004");
  });
});
