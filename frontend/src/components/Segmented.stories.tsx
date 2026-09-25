import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import Segmented from "./Segmented";

const options = [
  { value: "task", label: "Task", icon: "board" as const },
  { value: "epic", label: "Epic", icon: "layers" as const },
];

const meta: Meta<typeof Segmented<string>> = {
  component: Segmented,
  tags: ["autodocs"],
  args: { label: "What are you creating?", options, value: "task" },
};

export default meta;
type Story = StoryObj<typeof Segmented<string>>;

export const Default: Story = {};

export const SecondSelected: Story = {
  args: { value: "epic" },
};

/** Wired to state, as in the New task dialog. */
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState("task");
    return <Segmented {...args} value={value} onChange={setValue} />;
  },
  play: async ({ canvas, userEvent }) => {
    const epic = canvas.getByRole("radio", { name: "Epic" });
    await expect(canvas.getByRole("radio", { name: "Task" })).toBeChecked();
    await userEvent.click(epic);
    await expect(epic).toBeChecked();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("radio", { name: "Task" })).toBeChecked();
  },
};
