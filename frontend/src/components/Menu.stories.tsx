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

/** A custom trigger row with a header, opening upward from the foot of the rail. */
export const AccountTrigger: Story = {
  decorators: [
    (Story) => (
      <div className="flex items-end p-8 bg-ground min-h-[320px] w-[288px]">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Account",
    align: "start",
    trigger: <span className="flex-1">Paul Miranda</span>,
    header: <span>paul@example.com</span>,
    items: [
      { icon: "theme", label: "Switch to dark theme", onSelect: fn() },
      "-",
      { icon: "out", label: "Sign out", onSelect: remove },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Paul Miranda" }));
    await expect(canvas.getByText("paul@example.com")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
    await expect(remove).toHaveBeenCalled();
  },
};

/** Items that can't be chosen right now stay listed, greyed out, with the reason as a tooltip. */
export const DisabledItem: Story = {
  args: {
    label: "Move PLAT-008",
    items: [
      { icon: "status", label: "To do", onSelect: fn() },
      {
        icon: "status",
        label: "Code review",
        disabled: true,
        title: "Blocked tasks can’t move forward",
        onSelect: remove,
      },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Move PLAT-008" }),
    );
    await expect(
      canvas.getByRole("button", { name: "Code review" }),
    ).toBeDisabled();
  },
};
