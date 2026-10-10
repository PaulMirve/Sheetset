import { describe, expect, it } from "vitest";
import type { Column } from "./types/column";
import type { ToDo, ToDoId } from "./types/ToDo";
import { canMove, doneColumn, toColumn, waitingOn } from "./tasks";

const columns: Column[] = [
  { id: toColumn("1"), code: "todo", name: "To do", position: 0 },
  { id: toColumn("2"), code: "doing", name: "Doing", position: 1 },
  { id: toColumn("3"), code: "code_review", name: "Code review", position: 2 },
  {
    id: toColumn("4"),
    code: "ready_for_qa",
    name: "Ready for QA",
    position: 3,
  },
  { id: toColumn("5"), code: "done", name: "Done", position: 4 },
];

const task = (patch: Partial<ToDo> = {}): ToDo => ({
  id: 1 as ToDoId,
  key: "APP-001",
  title: "Task",
  description: "",
  column: toColumn("2"),
  isEpic: false,
  isBlocked: false,
  needsHumanReview: false,
  subtasks: [],
  blockedBy: [],
  files: [],
  created_at: "2026-10-09",
  updated_at: "2026-10-09",
  ...patch,
});

describe("fixed workflow", () => {
  it("finds Done by code regardless of name or array order", () => {
    const reordered = [...columns]
      .reverse()
      .map((c) => ({ ...c, name: "Renamed" }));
    expect(doneColumn(reordered)).toBe(toColumn("5"));
    expect(
      doneColumn(columns.filter((c) => c.code !== "done")),
    ).toBeUndefined();
  });

  it.each(["isBlocked", "needsHumanReview"] as const)(
    "%s prevents advancing but permits returning",
    (flag) => {
      const todo = task({ [flag]: true });
      expect(canMove(todo, toColumn("3"), [todo], columns)).toBe(false);
      expect(canMove(todo, toColumn("1"), [todo], columns)).toBe(true);
      expect(canMove(todo, toColumn("2"), [todo], columns)).toBe(true);
      expect(canMove(todo, toColumn("3"), [todo], [...columns].reverse())).toBe(
        false,
      );
    },
  );

  it("QA does not complete a dependency", () => {
    const blocker = task({ id: 2 as ToDoId, column: toColumn("4") });
    const todo = task({ blockedBy: [blocker.id] });
    expect(waitingOn(todo, [todo, blocker], columns)).toEqual([blocker]);
    expect(canMove(todo, toColumn("3"), [todo, blocker], columns)).toBe(false);
    const completed = { ...blocker, column: toColumn("5") };
    expect(canMove(todo, toColumn("3"), [todo, completed], columns)).toBe(true);
  });

  it("permits review corrections and rejects unknown destinations", () => {
    const todo = task({ column: toColumn("3") });
    expect(canMove(todo, toColumn("2"), [todo], columns)).toBe(true);
    expect(canMove(todo, toColumn("99"), [todo], columns)).toBe(false);
  });
});
