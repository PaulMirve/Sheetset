import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import Button from "./Button";
import EmptyState from "./EmptyState";
import Icon from "./Icon";

const meta: Meta<typeof EmptyState> = {
  component: EmptyState,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="grid min-h-[420px] bg-ground">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

const addColumn = fn();

export const NoColumns: Story = {
  args: {
    icon: "cols",
    title: "No columns yet",
    children: "Add a column to start putting tasks on this board.",
    action: (
      <Button onClick={addColumn}>
        <Icon name="plus" /> Add column
      </Button>
    ),
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: "No columns yet" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Add column" }));
    await expect(addColumn).toHaveBeenCalled();
  },
};

export const WithoutAction: Story = {
  args: {
    icon: "board",
    title: "No boards yet",
    children: "Create one with “New board” in the sidebar.",
  },
};
