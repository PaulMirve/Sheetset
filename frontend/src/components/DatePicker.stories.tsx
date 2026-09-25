import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import DatePicker from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  component: DatePicker,
  tags: ["autodocs"],
  args: { label: "Due date", icon: "cal", onChange: fn() },
  decorators: [
    (Story) => (
      <div className="w-[300px] p-6 min-h-[460px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Empty: Story = {
  args: { optional: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Due date/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Today" }));
    await expect(args.onChange).toHaveBeenCalledWith(
      new Date().toLocaleDateString("en-CA"),
    );
  },
};

export const Filled: Story = {
  args: { optional: true, defaultValue: "2026-09-29" },
  play: async ({ args, canvas, userEvent }) => {
    const field = canvas.getByRole("button", { name: /Due date/ });
    await expect(field).toHaveTextContent("Tue, Sep 29, 2026");
    await userEvent.click(field);
    // Keyboard: the selected day has focus; move a day on and pick it.
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await expect(args.onChange).toHaveBeenCalledWith("2026-09-30");
  },
};

export const Clear: Story = {
  args: { optional: true, defaultValue: "2026-09-29" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Due date/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(args.onChange).toHaveBeenCalledWith("");
    await expect(
      canvas.getByRole("button", { name: /Due date/ }),
    ).toHaveTextContent("Pick a date");
  },
};

export const WithError: Story = {
  args: { defaultValue: "2026-09-29", error: "Enter a valid date." },
};
