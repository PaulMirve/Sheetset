import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import EditableTitle from "./EditableTitle";

const meta: Meta<typeof EditableTitle> = {
  component: EditableTitle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 pl-11 bg-surface max-w-lg">
        <Story />
      </div>
    ),
  ],
  args: {
    "aria-label": "Title",
    defaultValue: "Plan Lisbon trip",
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof EditableTitle>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const title = canvas.getByLabelText("Title");
    await userEvent.type(title, " in May");
    await expect(args.onChange).toHaveBeenLastCalledWith(
      "Plan Lisbon trip in May",
    );
    // Enter finishes editing instead of adding a line break.
    await userEvent.keyboard("{Enter}");
    await expect(title).not.toHaveFocus();
    await expect(title).toHaveValue("Plan Lisbon trip in May");
  },
};

export const LongTitleWraps: Story = {
  args: {
    defaultValue:
      "Map the two missing legacy tiers and rerun the billing dry-run on staging before Friday",
  },
};

/** Emptying the title never saves; leaving the field puts the saved title back. */
export const CantBeEmpty: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const title = canvas.getByLabelText("Title");
    await userEvent.clear(title);
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.tab();
    await expect(title).toHaveValue("Plan Lisbon trip");
  },
};
