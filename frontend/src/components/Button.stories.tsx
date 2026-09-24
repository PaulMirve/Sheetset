import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button";
import Icon from "./Icon";

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
      options: ["primary", "secondary", "quiet", "danger", "icon"],
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
