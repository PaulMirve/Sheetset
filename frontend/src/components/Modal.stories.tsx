import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import Input from "./Input";
import Modal from "./Modal";
import Select from "./Select";
import TextArea from "./TextArea";

const meta: Meta<typeof Modal> = {
  component: Modal,
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const NewTask: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const close = () => setOpen(false);
    return (
      <div className="p-8 bg-ground min-h-screen">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          open={open}
          onClose={close}
          title="New task"
          footer={
            <>
              <Button variant="quiet" onClick={close}>
                Cancel
              </Button>
              <Button onClick={close}>Add task</Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Input label="Title" icon="notes" placeholder="What needs doing?" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Column"
                icon="cols"
                options={[
                  { value: "todo", label: "To do" },
                  { value: "done", label: "Done" },
                ]}
              />
              <Input label="Due date" type="date" optional />
            </div>
            <TextArea label="Notes" icon="notes" optional />
          </div>
        </Modal>
      </div>
    );
  },
};

/** Extra icon buttons sit beside Close, like the task dialog's "Open full page". */
export const WithActions: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: "Task details",
    actions: (
      <Button variant="icon" aria-label="Open full page">
        <Icon name="expand" />
      </Button>
    ),
    children: "Body",
  },
};
