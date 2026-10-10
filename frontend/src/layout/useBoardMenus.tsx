import ConfirmDialog from "@components/ConfirmDialog";
import { MenuItem } from "@components/Menu";
import NameDialog from "@components/NameDialog";
import {
  useCreateColumn,
  useDeleteBoard,
  useDeleteColumn,
  useUpdateBoard,
  useUpdateColumn,
} from "@hooks/useBoards";
import { useMe } from "@hooks/useMe";
import { Board } from "@system-types/Board";
import { Column } from "@system-types/column";
import { ToDo } from "@system-types/ToDo";
import { useState } from "react";

type Dialog =
  | { kind: "rename-board" | "delete-board" | "add-column" }
  | { kind: "rename-column" | "delete-column"; column: Column };

/** The board's ⋯ menu, each column's ⋯ menu, and the rename/add/delete dialogs they open. */
export const useBoardMenus = (
  board: Board,
  todos: ToDo[],
  onNewEpic: () => void,
) => {
  const { columns } = board;
  const me = useMe().data;
  const updateBoard = useUpdateBoard(board.id);
  const deleteBoard = useDeleteBoard(board.id);
  const createColumn = useCreateColumn(board.id);
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const boardMenu: MenuItem[] = [
    {
      icon: "pen",
      label: "Rename board",
      onSelect: () => setDialog({ kind: "rename-board" }),
    },
    {
      icon: "cols",
      label: "Add column",
      onSelect: () => setDialog({ kind: "add-column" }),
    },
    ...(columns.length
      ? [{ icon: "layers" as const, label: "New epic", onSelect: onNewEpic }]
      : []),
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

  const columnMenu = (column: Column, i: number): MenuItem[] => {
    const move = (position: number) => () =>
      updateColumn.mutate({ id: column.id, position });
    return [
      {
        icon: "pen",
        label: "Rename column",
        onSelect: () => setDialog({ kind: "rename-column", column }),
      },
      ...(i > 0
        ? [
            {
              icon: "arrow-left" as const,
              label: "Move left",
              onSelect: move(i - 1),
            },
          ]
        : []),
      ...(i < columns.length - 1
        ? [
            {
              icon: "arrow" as const,
              label: "Move right",
              onSelect: move(i + 1),
            },
          ]
        : []),
      "-",
      {
        icon: "trash",
        label: "Delete column",
        danger: true,
        onSelect: () => setDialog({ kind: "delete-column", column }),
      },
    ];
  };

  const columnTasks =
    dialog?.kind === "delete-column"
      ? todos.filter((t) => t.column === dialog.column.id).length
      : 0;

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
      {dialog?.kind === "add-column" && (
        <NameDialog
          title="Add column"
          label="Column name"
          submitLabel="Add column"
          onSubmit={(name) => createColumn.mutateAsync({ name })}
          onClose={close}
        />
      )}
      {dialog?.kind === "rename-column" && (
        <NameDialog
          title="Rename column"
          label="Column name"
          defaultValue={dialog.column.name}
          submitLabel="Save"
          onSubmit={(name) =>
            updateColumn.mutateAsync({ id: dialog.column.id, name })
          }
          onClose={close}
        />
      )}
      {dialog?.kind === "delete-column" && (
        <ConfirmDialog
          title="Delete column?"
          confirmLabel="Delete column"
          onConfirm={() => deleteColumn.mutateAsync(dialog.column.id)}
          onClose={close}
        >
          “{dialog.column.name}”
          {columnTasks > 0 &&
            ` and its ${columnTasks} task${columnTasks > 1 ? "s" : ""}`}{" "}
          will be deleted. This can’t be undone.
        </ConfirmDialog>
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
    columnMenu,
    addColumn: () => setDialog({ kind: "add-column" }),
    dialogs,
  };
};
