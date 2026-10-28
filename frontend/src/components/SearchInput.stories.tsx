import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import SearchInput from "./SearchInput";

const meta: Meta<typeof SearchInput> = {
  component: SearchInput,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface max-w-md">
        <Story />
      </div>
    ),
  ],
  args: {
    "aria-label": "Search tasks",
    placeholder: "Search tasks",
    onSearch: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const box = canvas.getByRole("searchbox", { name: "Search tasks" });
    await userEvent.type(box, "login");
    await expect(box).toHaveValue("login");
    // Debounced: one call with the whole text, not one per key.
    await waitFor(() =>
      expect(args.onSearch).toHaveBeenLastCalledWith("login"),
    );
    await expect(args.onSearch).not.toHaveBeenCalledWith("l");
  },
};

export const Filled: Story = {
  args: { defaultValue: "APP-007" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
