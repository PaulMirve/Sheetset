import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Select from "./Select";

const COLUMNS = [
  { value: "todo", label: "To do" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
];

const meta: Meta<typeof Select> = {
  component: Select,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface max-w-md">
        <Story />
      </div>
    ),
  ],
  args: { label: "Column", icon: "status", options: COLUMNS },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByLabelText("Column");
    await userEvent.selectOptions(select, "Doing");
    await expect(select).toHaveValue("doing");
  },
};

export const WithPlaceholderOption: Story = {
  args: {
    options: [{ value: "", label: "Same as “Add to” below" }, ...COLUMNS],
  },
};

export const WithError: Story = {
  args: { error: "Pick a column." },
};

export const Disabled: Story = {
  args: { disabled: true },
};
