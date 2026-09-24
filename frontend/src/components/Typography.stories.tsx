import type { Meta, StoryObj } from "@storybook/react-vite";
import Typography from "./Typography";
import { COLOR_NAMES } from "../types/colors";

const VARIANTS = [
  "headline",
  "headline-sm",
  "title",
  "body",
  "body-lg",
  "label",
  "chip",
  "brand",
] as const;

const meta: Meta<typeof Typography> = {
  component: Typography,
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    color: { control: "select", options: COLOR_NAMES },
  },
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Headline: Story = {
  args: { variant: "headline", children: "Headline" },
};
export const HeadlineSmall: Story = {
  args: { variant: "headline-sm", children: "Headline small" },
};
export const Title: Story = { args: { variant: "title", children: "Title" } };
export const Body: Story = { args: { variant: "body", children: "Body" } };
export const BodyLarge: Story = {
  args: { variant: "body-lg", color: "muted", children: "Body large" },
};
export const Label: Story = {
  args: { variant: "label", color: "muted", children: "Label" },
};
export const Chip: Story = { args: { variant: "chip", children: "3 of 5" } };
export const Brand: Story = {
  args: { variant: "brand", children: "Sheetset" },
};
export const AsHeading: Story = {
  args: { as: "h2", variant: "headline-sm", children: "Rendered as an h2" },
};
