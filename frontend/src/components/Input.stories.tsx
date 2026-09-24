import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Input from "./Input";

const meta: Meta<typeof Input> = {
  component: Input,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface max-w-md">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "number", "date", "email", "password"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Text: Story = {
  args: { label: "Title", icon: "notes", placeholder: "What needs doing?" },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Title");
    await userEvent.type(input, "Draft the FAQ");
    await expect(input).toHaveValue("Draft the FAQ");
  },
};

export const Email: Story = {
  args: {
    label: "Email",
    icon: "mail",
    type: "email",
    placeholder: "you@company.com",
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    icon: "lock",
    type: "password",
    placeholder: "At least 8 characters",
  },
};

export const Number: Story = {
  args: { label: "Estimate", type: "number", min: 0, placeholder: "0" },
};

export const Date: Story = {
  args: { label: "Due date", icon: "cal", type: "date", optional: true },
};

export const WithError: Story = {
  args: { label: "Title", icon: "notes", error: "Give the task a title." },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Title");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Give the task a title.");
  },
};

export const Disabled: Story = {
  args: { label: "Title", disabled: true, value: "Locked" },
};
