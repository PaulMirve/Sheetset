import ConfirmDialog from "@components/ConfirmDialog";
import { MenuItem } from "@components/Menu";
import NameDialog from "@components/NameDialog";
import { useDeleteBoard, useUpdateBoard } from "@hooks/useBoards";
import { useMe } from "@hooks/useMe";
import { Board } from "@system-types/Board";
import { ToDo } from "@system-types/ToDo";
import { useState } from "react";

type Dialog = { kind: "rename-board" | "delete-board" };

/** Board actions and their rename/delete dialogs. Workflow columns are fixed. */
export const useBoardMenus = (
  board: Board,
  todos: ToDo[],
  onNewEpic: () => void,
) => {
  const me = useMe().data;
  const updateBoard = useUpdateBoard(board.id);
  const deleteBoard = useDeleteBoard(board.id);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const boardMenu: MenuItem[] = [
    {
      icon: "pen",
      label: "Rename board",
      onSelect: () => setDialog({ kind: "rename-board" }),
    },
    { icon: "layers", label: "New epic", onSelect: onNewEpic },
    ...(me?.id === board.owner_id
      ? [
          "-" as const,
          {
            icon: "trash" as const,
            label: "Delete board",
            danger: true,
            onSelect: () => setDialog({ kind: "delete-board" }),
          },
        ]
      : []),
  ];

  const dialogs = (
    <>
      {dialog?.kind === "rename-board" && (
        <NameDialog
          title="Rename board"
          label="Board name"
          defaultValue={board.name}
          submitLabel="Save"
          onSubmit={(name) => updateBoard.mutateAsync({ name })}
          onClose={close}
        />
      )}
      {dialog?.kind === "delete-board" && (
        <ConfirmDialog
          title="Delete board?"
          confirmLabel="Delete board"
          onConfirm={() => deleteBoard.mutateAsync()}
          onClose={close}
        >
          “{board.name}”, its columns and all {todos.length} tasks will be
          deleted for everyone on it. This can’t be undone.
        </ConfirmDialog>
      )}
    </>
  );

  return {
    boardMenu,
    dialogs,
  };
};
