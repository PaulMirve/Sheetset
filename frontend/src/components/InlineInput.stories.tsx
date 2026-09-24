import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Icon from "./Icon";
import InlineInput from "./InlineInput";

const meta: Meta<typeof InlineInput> = {
  component: InlineInput,
  tags: ["autodocs"],
  // The row draws the field; InlineInput only holds the text.
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface max-w-md">
        <label className="flex items-center gap-2.5 h-11 px-3 rounded-[10px] bg-ground border border-transparent text-muted hover:border-line-strong focus-within:bg-surface focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--color-primary-wash)]">
          <Icon name="plus" size={18} />
          <Story />
        </label>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InlineInput>;

export const Empty: Story = {
  args: {
    "aria-label": "New subtask",
    placeholder: "Add a subtask, press Enter",
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("New subtask");
    await userEvent.type(input, "Book flights");
    await expect(input).toHaveValue("Book flights");
  },
};

export const WithValue: Story = {
  args: {
    "aria-label": "Subtask title",
    defaultValue: "Find a place near Alfama",
  },
};
