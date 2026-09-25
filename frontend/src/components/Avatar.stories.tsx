import type { Meta, StoryObj } from "@storybook/react-vite";
import type { UserId } from "@system-types/user";
import { expect } from "storybook/test";
import Avatar from "./Avatar";

const user = (id: number, first_name: string, last_name: string) => ({
  id: id as UserId,
  first_name,
  last_name,
});

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  tags: ["autodocs"],
  args: { user: user(1, "Paul", "Miranda") },
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface flex gap-2 items-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole("img", { name: "Paul Miranda" });
    await expect(avatar).toHaveTextContent("PM");
  },
};

export const Sizes: Story = {
  render: (args) => (
    <>
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </>
  ),
};

export const Hues: Story = {
  render: () => (
    <>
      {[
        user(1, "Paul", "Miranda"),
        user(2, "Jo", "Park"),
        user(3, "Mia", "Chen"),
        user(4, "Sam", "Ortiz"),
        user(5, "Ana", "Silva"),
        user(6, "Leo", "Kim"),
      ].map((u) => (
        <Avatar key={u.id} user={u} />
      ))}
    </>
  ),
};
