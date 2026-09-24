import type { Meta, StoryObj } from "@storybook/react-vite";
import { COLOR_NAMES } from "@system-types/colors";
import { ICON_NAMES } from "@system-types/IconName";
import Icon from "./Icon";

const meta: Meta<typeof Icon> = {
  component: Icon,
  argTypes: {
    name: { control: "select", options: ICON_NAMES },
    color: { control: "select", options: COLOR_NAMES },
    width: { control: "number" },
    height: { control: "number" },
  },
  args: {
    width: 15,
    height: 15,
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Single: Story = {
  args: { name: "board" },
};

export const AllIcons: Story = {
  render: (args) => (
    <div
      style={{
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon {...args} name={name} />
          <span style={{ fontSize: 11, color: "#888" }}>{name}</span>
        </div>
      ))}
    </div>
  ),
};
