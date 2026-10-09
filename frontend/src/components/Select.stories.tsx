import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
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
  args: { label: "Column", icon: "status", options: COLUMNS, onChange: fn() },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Column" });
    await userEvent.click(select);
    const list = within(canvasElement.ownerDocument.body).getByRole("listbox");
    await userEvent.click(within(list).getByRole("option", { name: "Doing" }));
    await expect(args.onChange).toHaveBeenCalledWith("doing");
    await expect(select).toHaveTextContent("Doing");
  },
};

export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Column" });
    select.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    await expect(args.onChange).toHaveBeenCalledWith("done");
    await expect(select).toHaveFocus();
  },
};

export const WithHints: Story = {
  args: {
    label: "Blocked by",
    icon: "lock",
    optional: true,
    value: "",
    options: [
      { value: "", label: "Add a task this waits on" },
      {
        value: "5",
        hint: "REYE-005",
        label: "Configuración: usuarios y doctores",
      },
      { value: "6", hint: "REYE-006", label: "Medios de llegada editables" },
      { value: "7", hint: "REYE-007", label: "Catálogo de tratamientos" },
    ],
  },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      ...COLUMNS,
      { value: "shipped", label: "Shipped (blocked)", disabled: true },
    ],
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
