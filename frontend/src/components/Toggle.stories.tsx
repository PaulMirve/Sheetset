import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import Toggle from "./Toggle";

const meta: Meta<typeof Toggle> = {
  component: Toggle,
  tags: ["autodocs"],
  args: { "aria-label": "Dark mode" },
  argTypes: {
    active: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Active: Story = {
  args: { active: true },
};

export const Inactive: Story = {
  args: { active: false },
};

/** Wired to state, as in the sidebar's dark-mode switch. */
export const Interactive: Story = {
  render: (args) => {
    const [on, setOn] = useState(false);
    return <Toggle {...args} active={on} onClick={() => setOn(!on)} />;
  },
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Dark mode" });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  },
};
