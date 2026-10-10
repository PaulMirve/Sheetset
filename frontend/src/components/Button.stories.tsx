import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button";
import { expect, fn } from "storybook/test";
import Icon from "./Icon";
import Tag from "./Tag";

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-ground">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "quiet", "danger", "icon", "bare"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: (
      <>
        <Icon name="plus" /> New task
      </>
    ),
  },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Button Secondary" },
};

export const Quiet: Story = {
  args: { variant: "quiet", children: "Button Quiet" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Button Danger" },
};

export const IconOnly: Story = {
  args: {
    variant: "icon",
    "aria-label": "More",
    children: <Icon name="more" />,
  },
};

/** A clickable Tag: the button adds behavior and focus, the Tag brings the look. */
export const Bare: Story = {
  args: {
    variant: "bare",
    title: "Open the epic",
    className: "rounded-full hover:brightness-95",
    onClick: fn(),
    children: <Tag icon="layers">Spring launch</Tag>,
  },
  play: async ({ args, canvas, userEvent }) => {
    const btn = canvas.getByRole("button", { name: "Spring launch" });
    await expect(btn).toHaveAttribute("type", "button");
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalled();
  },
};
