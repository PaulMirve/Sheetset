import type { Meta, StoryObj } from "@storybook/react-vite";
import Input from "./Input";
import Select from "./Select";
import TextArea from "./TextArea";

const meta: Meta<typeof Input> = {
  component: Input,
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface max-w-md">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    type: { control: "select", options: ["text", "number", "date"] },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Text: Story = {
  args: { label: "Title", icon: "notes", placeholder: "What needs doing?" },
};

export const Number: Story = {
  args: { label: "Estimate", type: "number", min: 0, placeholder: "0" },
};

export const Date: Story = {
  args: { label: "Due date", type: "date", optional: true },
};

export const WithError: Story = {
  args: { label: "Title", icon: "notes", error: "Give the task a title." },
};

export const Disabled: Story = {
  args: { label: "Title", disabled: true, value: "Locked" },
};

export const TextAreaField: Story = {
  render: () => (
    <TextArea
      label="Notes"
      icon="notes"
      optional
      placeholder="Add context, links or acceptance criteria"
    />
  ),
};

export const SelectField: Story = {
  render: () => (
    <Select
      label="Column"
      icon="cols"
      options={[
        { value: "todo", label: "To do" },
        { value: "doing", label: "Doing" },
        { value: "done", label: "Done" },
      ]}
    />
  ),
};
