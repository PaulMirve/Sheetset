import type { Meta, StoryObj } from "@storybook/react-vite";
import { hashHue, hue } from "../hue";
import Tag from "./Tag";

const meta: Meta<typeof Tag> = {
  component: Tag,
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface flex gap-2 flex-wrap">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Label: Story = {
  render: () => (
    <>
      {["Design", "Backend", "Bug", "Research", "Docs", "Ops"].map((l) => (
        <Tag key={l} dot style={hashHue(l)}>
          {l}
        </Tag>
      ))}
    </>
  ),
};

export const Neutral: Story = {
  args: { icon: "check", children: "Sep 18" },
};

export const Overdue: Story = {
  args: {
    icon: "check",
    style: { "--h": "var(--alert)" } as React.CSSProperties,
    children: "Overdue · Sep 12",
  },
};

export const Crumb: Story = {
  args: { icon: "board", style: hue(1), children: "Website relaunch" },
};

export const Truncated: Story = {
  render: () => (
    <Tag dot style={hashHue("Long")} className="max-w-32">
      A very long label that truncates
    </Tag>
  ),
};
