import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import Menu from "./Menu";

const meta: Meta<typeof Menu> = {
  component: Menu,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex justify-end p-8 bg-ground min-h-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Menu>;

const rename = fn();
const remove = fn();

export const Default: Story = {
  args: {
    label: "Board options",
    items: [
      { icon: "pen", label: "Rename board", onSelect: rename },
      { icon: "cols", label: "Add column", onSelect: fn() },
      "-",
      { icon: "trash", label: "Delete board", danger: true, onSelect: remove },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Board options" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Rename board" }));
    await expect(rename).toHaveBeenCalled();
    // Choosing an item closes the menu.
    await expect(
      canvas.getByRole("button", { name: "Delete board", hidden: true }),
    ).not.toBeVisible();
  },
};
