import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import FileButton from "./FileButton";
import Icon from "./Icon";

const meta: Meta<typeof FileButton> = {
  component: FileButton,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-ground">
        <Story />
      </div>
    ),
  ],
  args: { onFiles: fn() },
};

export default meta;
type Story = StoryObj<typeof FileButton>;

export const Default: Story = {
  args: {
    variant: "quiet",
    multiple: true,
    children: (
      <>
        <Icon name="plus" /> Add files
      </>
    ),
  },
  play: async ({ args, canvasElement, userEvent }) => {
    const input =
      canvasElement.querySelector<HTMLInputElement>("input[type=file]")!;
    const file = new File(["hi"], "notes.txt", { type: "text/plain" });
    await userEvent.upload(input, file);
    await expect(args.onFiles).toHaveBeenCalledWith([file]);
  },
};

export const Disabled: Story = {
  args: { variant: "secondary", disabled: true, children: "Attaching…" },
};
