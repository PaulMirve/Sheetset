import type { Meta, StoryObj } from "@storybook/react-vite";
import Typography from "./Typography";
import { COLOR_NAMES } from "../types/colors";

const meta: Meta<typeof Typography> = {
  component: Typography,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "heading-xl",
        "heading-l",
        "heading-m",
        "heading-s",
        "body-large",
        "body",
      ],
    },
    color: {
      control: "select",
      options: COLOR_NAMES,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const HeadingXL: Story = {
  args: { variant: "heading-xl", children: "Heading XL" },
};

export const HeadingL: Story = {
  args: { variant: "heading-l", children: "Heading L" },
};

export const HeadingM: Story = {
  args: { variant: "heading-m", children: "Heading M" },
};

export const HeadingS: Story = {
  args: { variant: "heading-s", children: "Heading S" },
};

export const BodyLarge: Story = {
  args: { variant: "body-large", children: "Body Large" },
};

export const Body: Story = {
  args: { variant: "body-medium", children: "Body" },
};
