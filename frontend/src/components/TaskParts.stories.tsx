import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { toColumn } from "../tasks";
import type { Column } from "../types/column";
import type { ToDo, ToDoId } from "../types/ToDo";
import { TaskProperties, useTaskSave } from "./TaskParts";

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

const todo: ToDo = {
  id: 1 as ToDoId,
  key: "APP-001",
  title: "Implement a ticket",
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
};

const meta = {
  title: "Features/Task properties",
  component: TaskProperties,
  tags: ["autodocs"],
  args: {
    todo,
    columns,
    todos: [todo],
    labels: [],
    save: fn(),
    errors: {},
  },
  render: function Properties(args) {
    const [current, setCurrent] = useState(args.todo);
    const { save, errors } = useTaskSave((patch) => {
      args.save(patch);
      setCurrent((previous) => ({ ...previous, ...patch }));
    });
    return (
      <div className="grid gap-4 w-80 p-4 bg-surface rounded-xl">
        <TaskProperties
          {...args}
          todo={current}
          todos={args.todos.map((t) => (t.id === current.id ? current : t))}
          save={save}
          errors={errors}
        />
      </div>
    );
  },
} satisfies Meta<typeof TaskProperties>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AttentionFlags: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const blocked = canvas.getByRole("checkbox", { name: "Blocked" });
    const human = canvas.getByRole("checkbox", { name: "Needs human review" });
    const column = canvas.getByRole("combobox", { name: "Column" });
    const openColumn = async () => {
      column.focus();
      await userEvent.keyboard("{ArrowDown}");
    };
    await userEvent.click(blocked);
    await expect(args.save).toHaveBeenCalledWith({ isBlocked: true });
    await openColumn();
    await expect(
      await canvas.findByRole("option", { name: "Code review (blocked)" }),
    ).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("option", { name: "To do" }));
    await expect(column).toHaveTextContent("To do");
    await expect(blocked).toBeChecked();
    await userEvent.click(blocked);
    await openColumn();
    await expect(
      await canvas.findByRole("option", { name: "Code review" }),
    ).not.toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("option", { name: "Doing" }));
    await userEvent.click(human);
    await expect(args.save).toHaveBeenCalledWith({ needsHumanReview: true });
    await openColumn();
    await expect(
      await canvas.findByRole("option", { name: "Done (blocked)" }),
    ).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("option", { name: "Doing" }));
    await userEvent.click(human);
    await openColumn();
    await userEvent.click(
      await canvas.findByRole("option", { name: "Code review" }),
    );
    await expect(column).toHaveTextContent("Code review");
    await openColumn();
    await userEvent.click(await canvas.findByRole("option", { name: "Doing" }));
    await expect(column).toHaveTextContent("Doing");
  },
};

export const WaitingOnQA: Story = {
  args: {
    todo: { ...todo, blockedBy: [2 as ToDoId] },
    todos: [
      { ...todo, blockedBy: [2 as ToDoId] },
      {
        ...todo,
        id: 2 as ToDoId,
        title: "Dependency awaiting QA",
        column: toColumn("4"),
      },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole("checkbox", { name: "Blocked" }),
    ).not.toBeChecked();
    canvas.getByRole("combobox", { name: "Column" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(
      await canvas.findByRole("option", { name: "Done (blocked)" }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(
      canvas.getByRole("option", { name: "To do" }),
    ).not.toHaveAttribute("aria-disabled", "true");
  },
};
