import type { Meta, StoryObj } from "@storybook/react-vite";
import Toggle from "./Toggle";

const meta: Meta<typeof Toggle> = {
  component: Toggle,
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
