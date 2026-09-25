import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import NameDialog from "./NameDialog";

const meta: Meta<typeof NameDialog> = {
  component: NameDialog,
  tags: ["autodocs"],
  args: {
    title: "Rename board",
    label: "Board name",
    defaultValue: "Platform Launch",
    submitLabel: "Save",
    onSubmit: fn(async () => {}),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof NameDialog>;

export const Rename: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const field = canvas.getByLabelText("Board name");
    await userEvent.clear(field);
    await userEvent.type(field, "  Launch  ");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onSubmit).toHaveBeenCalledWith("Launch");
  },
};

export const Empty: Story = {
  args: {
    title: "Add column",
    label: "Column name",
    defaultValue: "",
    submitLabel: "Add column",
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add column" }));
    await expect(canvas.getByText("Give it a name.")).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const ServerError: Story = {
  args: {
    onSubmit: fn(async () => Promise.reject(new Error("board not found"))),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(await canvas.findByText("board not found")).toBeVisible();
  },
};
