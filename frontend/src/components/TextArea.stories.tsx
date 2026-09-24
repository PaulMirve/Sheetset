import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import TextArea from "./TextArea";

const meta: Meta<typeof TextArea> = {
  component: TextArea,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface max-w-md">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Notes",
    icon: "notes",
    placeholder: "Add context, links or acceptance criteria",
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const area = canvas.getByLabelText("Notes");
    await userEvent.type(area, "Line one{enter}Line two");
    await expect(area).toHaveValue("Line one\nLine two");
  },
};

export const Optional: Story = {
  args: { optional: true },
};

export const WithError: Story = {
  args: { error: "Notes can’t be longer than 2,000 characters." },
};

export const Disabled: Story = {
  args: { disabled: true, value: "Read only notes" },
};
