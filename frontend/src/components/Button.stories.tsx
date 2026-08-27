import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  decorators: [
    (Story, context) => (
      <div data-theme={context.globals.theme} className="p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "destruction"],
    },
    size: { control: "select", options: ["large", "small"] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary", size: "large", children: "Button Primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary", size: "large", children: "Button Secondary" },
};

export const Destruction: Story = {
  args: {
    variant: "destruction",
    size: "large",
    children: "Button Destruction",
  },
};

export const Small: Story = {
  args: { variant: "primary", size: "small" },
};
