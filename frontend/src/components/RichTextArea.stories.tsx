import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import RichTextArea from "./RichTextArea";
import { plain } from "./ToDoCard";

const meta: Meta<typeof RichTextArea> = {
  component: RichTextArea,
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
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof RichTextArea>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const box = canvas.getByRole("textbox", { name: "Notes" });
    await userEvent.click(box);
    await userEvent.type(box, "- first");
    await expect(box.querySelector("ul li")).toHaveTextContent("first");
    await expect(args.onChange).toHaveBeenLastCalledWith("- first");
  },
};

export const FromMarkdown: Story = {
  args: {
    defaultValue:
      "## Goal\n\nShip **bold** and _italic_ with a [link](https://x.dev)\n\n1. one\n2. two",
  },
  play: async ({ canvas, args }) => {
    const box = canvas.getByRole("textbox", { name: "Notes" });
    await expect(box.querySelector("h2")).toHaveTextContent("Goal");
    await expect(box.querySelector("strong")).toHaveTextContent("bold");
    await expect(box.querySelector("ol")?.children).toHaveLength(2);
    await expect(plain(args.defaultValue!)).toBe(
      "Goal\n\nShip bold and italic with a link\n\none\ntwo",
    );
  },
};
