import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import Checkbox from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: { "aria-label": "Done" },
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", { name: "Done" });
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

export const WithLabel: Story = {
  args: { label: "3 of 6 selected" },
  play: async ({ canvas, userEvent }) => {
    // Clicking the text toggles the box too.
    await userEvent.click(canvas.getByText("3 of 6 selected"));
    await expect(canvas.getByRole("checkbox")).toBeChecked();
  },
};

export const Indeterminate: Story = {
  args: { label: "3 of 6 selected", indeterminate: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole<HTMLInputElement>("checkbox");
    await expect(box.indeterminate).toBe(true);
  },
};

export const Medium: Story = {
  args: { size: "md", "aria-label": "Create this task", defaultChecked: true },
};

export const Disabled: Story = {
  args: { label: "Can’t change this", disabled: true, defaultChecked: true },
};

/** A "select all" box driving a list: all, none, or some (indeterminate). */
export const SelectAll: Story = {
  render: () => {
    const items = ["Draft the FAQ", "Book the go/no-go", "Fix focus order"];
    const [sel, setSel] = useState(new Set([0]));
    const n = sel.size;
    return (
      <div className="grid gap-3">
        <Checkbox
          label={`${n} of ${items.length} selected`}
          checked={n === items.length}
          indeterminate={n > 0 && n < items.length}
          onChange={(e) =>
            setSel(new Set(e.target.checked ? items.map((_, i) => i) : []))
          }
        />
        {items.map((item, i) => (
          <Checkbox
            key={item}
            label={item}
            checked={sel.has(i)}
            onChange={() => {
              const next = new Set(sel);
              if (!next.delete(i)) next.add(i);
              setSel(next);
            }}
          />
        ))}
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const all = canvas.getByRole<HTMLInputElement>("checkbox", {
      name: /selected/,
    });
    await expect(all.indeterminate).toBe(true);
    await userEvent.click(all);
    await expect(canvas.getByText("3 of 3 selected")).toBeInTheDocument();
    await userEvent.click(all);
    await expect(canvas.getByText("0 of 3 selected")).toBeInTheDocument();
  },
};
