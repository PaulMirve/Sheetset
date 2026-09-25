import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import ConfirmDialog from "./ConfirmDialog";

const meta: Meta<typeof ConfirmDialog> = {
  component: ConfirmDialog,
  tags: ["autodocs"],
  args: {
    title: "Delete column?",
    children: "“Doing” and its 3 tasks will be deleted. This can’t be undone.",
    confirmLabel: "Delete column",
    onConfirm: fn(async () => {}),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete column" }),
    );
    await expect(args.onConfirm).toHaveBeenCalled();
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const ServerError: Story = {
  args: {
    onConfirm: fn(async () => Promise.reject(new Error("column not found"))),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete column" }),
    );
    await expect(await canvas.findByText("column not found")).toBeVisible();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};
