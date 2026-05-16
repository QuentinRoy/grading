import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import DeleteRubricDialog from "./DeleteRubricDialog";
import type { DeleteRubricDialogProps } from "./DeleteRubricDialog";

const meta: Meta<typeof DeleteRubricDialog> = {
  title: "Rubrics/DeleteRubricDialog",
  component: DeleteRubricDialog,
};
export default meta;

type Story = StoryObj<typeof DeleteRubricDialog>;

function Wrapper(props: Partial<DeleteRubricDialogProps>) {
  const [open, setOpen] = useState(true);
  return (
    <DeleteRubricDialog
      open={open}
      rubric={{ id: "RUBRIC-1", assessmentCount: 3 }}
      action={() => setOpen(false)}
      actionState={{ status: "idle" }}
      onClose={() => setOpen(false)}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Error: Story = {
  render: () => (
    <Wrapper
      actionState={{ status: "error", formErrors: ["Something went wrong"] }}
    />
  ),
};

export const Success: Story = {
  render: () => (
    <Wrapper actionState={{ status: "success", message: "Rubric deleted" }} />
  ),
};
