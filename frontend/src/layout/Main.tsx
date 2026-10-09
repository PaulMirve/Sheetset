import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DroppableColumn from "@components/DroppableColumn";
import ToDoCard, { Card, EpicKid } from "@components/ToDoCard";
import Navbar from "./Navbar";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@hooks/queryKeys";
import { Board } from "@system-types/Board";
import { Column, ColumnId } from "@system-types/column";
import { ToDo, ToDoId } from "@system-types/ToDo";
import MeetingModal from "@components/MeetingModal";
import {
  canMove,
  NewTaskModal,
  TaskDetailModal,
  TaskFields,
  waitingOn,
} from "@components/TaskModal";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from "@hooks/useTasks";
import {
  useCreateColumn,
  useDeleteBoard,
  useDeleteColumn,
  useUpdateBoard,
  useUpdateColumn,
} from "@hooks/useBoards";
import { useMe } from "@hooks/useMe";
import { MenuItem } from "@components/Menu";
import NameDialog from "@components/NameDialog";
import ConfirmDialog from "@components/ConfirmDialog";
import EmptyState from "@components/EmptyState";
import Button from "@components/Button";
import Icon from "@components/Icon";
import TaskPage from "@components/TaskPage";
import { openTaskPage, useTaskRoute } from "@hooks/useTaskRoute";

type Dialog =
  | { kind: "rename-board" | "delete-board" | "add-column" }
  | { kind: "rename-column" | "delete-column"; column: Column };

const Main = ({ board }: { board: Board }) => {
  const { columns } = board;
  const me = useMe().data;
  const updateBoard = useUpdateBoard(board.id);
  const deleteBoard = useDeleteBoard(board.id);
  const createColumn = useCreateColumn(board.id);
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const closeDialog = () => setDialog(null);
  const queryClient = useQueryClient();
  const tasks = useTasks(board);
  const create = useCreateTask(board);
  const updateTask = useUpdateTask(board.id);
  const deleteTask = useDeleteTask(board.id);
  // While dragging, cards move in this local copy; the server hears about it on drop.
  const [dragTodos, setDragTodos] = useState<ToDo[] | null>(null);
  const todos = dragTodos ?? tasks.data ?? [];
  const [activeId, setActiveId] = useState<number | null>(null);
  const [landedId, setLandedId] = useState<number | null>(null);
  const [openTask, setOpenTask] = useState<ToDoId | "new" | "meeting" | null>(
    null,
  );
  // New task dialog options: open as an epic, or preselect an epic.
  const [newOpts, setNewOpts] = useState<{ asEpic?: boolean; epic?: ToDoId }>(
    {},
  );
  const openNew = (opts: typeof newOpts = {}) => {
    setNewOpts(opts);
    setOpenTask("new");
  };
  // The meeting dialog opens on the list, or on one meeting (a task's source).
  const [meetingId, setMeetingId] = useState<number>();
  const openMeeting = (id?: number) => {
    setMeetingId(id);
    setOpenTask("meeting");
  };
  const detail = todos.find((t) => t.id === openTask);
  const route = useTaskRoute();
  const page =
    route?.board === board.key
      ? todos.find((t) => t.key === route.key)
      : undefined;
  const openPage = (id: ToDoId | null) =>
    openTaskPage(todos.find((t) => t.id === id)?.key ?? null);
  const labels = [...new Set(todos.flatMap((t) => t.label ?? []))];
  const sensors = useSensors(
    // Small distance so a click opens the card instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Enter opens the card, so only Space picks it up.
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  // An epic's "first tasks" become real tasks beside it, in the same column.
  const createTask = async ({ subtasks, ...fields }: TaskFields) => {
    const todo = await create.mutateAsync({
      ...fields,
      subtasks: fields.isEpic ? [] : subtasks,
    });
    setLandedId(todo.id);
    if (fields.isEpic)
      for (const st of subtasks)
        await create.mutateAsync({
          title: st.title,
          description: "",
          column: todo.column,
          epic: todo.id,
          subtasks: [],
        });
  };

  // Epics are containers, not work: they don't count towards the board's totals.
  const work = todos.filter((t) => !t.isEpic);
  const kidsOf = (epic: ToDo): EpicKid[] =>
    columns.flatMap((c, i) =>
      todos
        .filter((t) => t.epic === epic.id && t.column === c.id)
        .map((t) => ({ todo: t, column: i, done: c.id === lastColumn })),
    );

  // ponytail: no undo toast yet, the design's "Deleted · Undo" comes later.
  const removeTask = (id: ToDoId) => {
    deleteTask.mutate(id);
    setOpenTask(null);
  };
  const activeTodo =
    activeId != null
      ? (todos.find((t) => (t.id as unknown as number) === activeId) ?? null)
      : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as number);
    setDragTodos(todos);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;

    const activeNumId = active.id as number;
    const overIsColumn = typeof over.id === "string";

    setDragTodos((prev) => {
      if (!prev) return prev;
      const activeIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === activeNumId,
      );
      const activeTodo = prev[activeIdx];
      // Checked against where the card started, with the board as saved.
      const saved = tasks.data ?? prev;
      const from = saved.find((t) => t.id === activeTodo.id) ?? activeTodo;
      const allowed = (column: ColumnId) =>
        canMove(from, column, saved, columns);

      if (overIsColumn) {
        const colNum = parseInt((over.id as string).replace("column-", ""), 10);
        const targetColumnId = colNum as unknown as ColumnId;
        if (activeTodo.column === targetColumnId) return prev;
        if (!allowed(targetColumnId)) return prev;
        const without = prev.filter(
          (t) => (t.id as unknown as number) !== activeNumId,
        );
        return [...without, { ...activeTodo, column: targetColumnId }];
      }

      const overNumId = over.id as number;
      const overIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === overNumId,
      );
      const overTodo = prev[overIdx];

      if (activeTodo.column === overTodo.column) return prev;
      if (!allowed(overTodo.column)) return prev;

      // Cross-column: remove active, insert at over card's position
      const without = [...prev];
      without.splice(activeIdx, 1);
      const newOverIdx = without.findIndex(
        (t) => (t.id as unknown as number) === overNumId,
      );
      without.splice(newOverIdx, 0, { ...activeTodo, column: overTodo.column });
      return without;
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setDragTodos(null);
    if (!over || !dragTodos) return;
    setLandedId(active.id as number);

    // Cross-column moves already applied in onDragOver; only same-column reorder is left.
    let next = dragTodos;
    const activeIdx = next.findIndex((t) => t.id === active.id);
    const overIdx = next.findIndex((t) => t.id === over.id);
    if (overIdx >= 0 && next[activeIdx].column === next[overIdx].column)
      next = arrayMove(next, activeIdx, overIdx);

    // Index within its column, before and after the drag.
    const indexIn = (list: ToDo[], t: ToDo) =>
      list.filter((x) => x.column === t.column).findIndex((x) => x.id === t.id);
    const moved = next[next.findIndex((t) => t.id === active.id)];
    const was = tasks.data?.find((t) => t.id === moved.id);
    const position = indexIn(next, moved);
    if (
      was &&
      was.column === moved.column &&
      indexIn(tasks.data!, was) === position
    )
      return;

    queryClient.setQueryData(taskKeys.board(board.id), next);
    updateTask.mutate({
      id: moved.id,
      patch: { column: moved.column },
      position,
    });
  };

  const lastColumn = columns[columns.length - 1]?.id;

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
      ? [
          {
            icon: "layers" as const,
            label: "New epic",
            onSelect: () => openNew({ asEpic: true }),
          },
        ]
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

  const dialogTasks =
    dialog?.kind === "delete-column"
      ? todos.filter((t) => t.column === dialog.column.id).length
      : 0;

  return (
    <main
      className={
        page
          ? "min-w-0 min-h-0 grid"
          : "min-w-0 min-h-0 grid grid-rows-[auto_minmax(0,1fr)]"
      }
    >
      {page ? (
        <TaskPage
          key={page.id}
          todo={page}
          board={board}
          columns={columns}
          todos={todos}
          labels={labels}
          onChange={(patch) => updateTask.mutate({ id: page.id, patch })}
          onChangeTask={(id, patch) => updateTask.mutate({ id, patch })}
          onCreate={createTask}
          onOpenTask={openPage}
          onOpenMeeting={openMeeting}
          onDelete={() => {
            removeTask(page.id);
            openPage(null);
          }}
          onBack={() => openPage(null)}
          onShowOnBoard={() => {
            setLandedId(page.id);
            openPage(null);
          }}
        />
      ) : (
        <Navbar
          board={board}
          columns={columns.length}
          menu={boardMenu}
          done={work.filter((t) => t.column === lastColumn).length}
          total={work.length}
          onNewTask={() => openNew()}
          onFromMeeting={() => openMeeting()}
        />
      )}
      {dialog?.kind === "rename-board" && (
        <NameDialog
          title="Rename board"
          label="Board name"
          defaultValue={board.name}
          submitLabel="Save"
          onSubmit={(name) => updateBoard.mutateAsync({ name })}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "add-column" && (
        <NameDialog
          title="Add column"
          label="Column name"
          submitLabel="Add column"
          onSubmit={(name) => createColumn.mutateAsync({ name })}
          onClose={closeDialog}
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
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "delete-column" && (
        <ConfirmDialog
          title="Delete column?"
          confirmLabel="Delete column"
          onConfirm={() => deleteColumn.mutateAsync(dialog.column.id)}
          onClose={closeDialog}
        >
          “{dialog.column.name}”
          {dialogTasks > 0 &&
            ` and its ${dialogTasks} task${dialogTasks > 1 ? "s" : ""}`}{" "}
          will be deleted. This can’t be undone.
        </ConfirmDialog>
      )}
      {dialog?.kind === "delete-board" && (
        <ConfirmDialog
          title="Delete board?"
          confirmLabel="Delete board"
          onConfirm={() => deleteBoard.mutateAsync()}
          onClose={closeDialog}
        >
          “{board.name}”, its columns and all {todos.length} tasks will be
          deleted for everyone on it. This can’t be undone.
        </ConfirmDialog>
      )}
      {openTask === "new" && (
        <NewTaskModal
          board={board}
          columns={columns}
          todos={todos}
          labels={labels}
          {...newOpts}
          onCreate={createTask}
          onClose={() => setOpenTask(null)}
        />
      )}
      {openTask === "meeting" && (
        <MeetingModal
          meetingId={meetingId}
          board={board}
          columns={columns}
          labels={labels}
          onCreated={(ids) => setLandedId(ids[0])}
          onClose={() => setOpenTask(null)}
        />
      )}
      {detail && (
        <TaskDetailModal
          key={detail.id}
          todo={detail}
          board={board}
          columns={columns}
          todos={todos}
          labels={labels}
          onChange={(patch) => updateTask.mutate({ id: detail.id, patch })}
          onChangeTask={(id, patch) => updateTask.mutate({ id, patch })}
          onOpenTask={setOpenTask}
          onCreate={createTask}
          onOpenMeeting={openMeeting}
          onDelete={() => removeTask(detail.id)}
          onOpenPage={() => {
            setOpenTask(null);
            openPage(detail.id);
          }}
          onClose={() => setOpenTask(null)}
        />
      )}
      {page ? null : columns.length === 0 ? (
        <EmptyState
          icon="cols"
          title="No columns yet"
          className="pb-24"
          action={
            <Button onClick={() => setDialog({ kind: "add-column" })}>
              <Icon name="plus" /> Add column
            </Button>
          }
        >
          Columns are the stages your tasks move through, like To do, Doing and
          Done. Add the first one to start.
        </EmptyState>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setDragTodos(null);
          }}
        >
          <div className="flex items-start gap-3.5 overflow-auto px-7 pb-6 max-md:px-4 max-md:pb-4 max-md:snap-x max-md:snap-mandatory">
            {columns.map((col, i) => {
              const colTodos = todos.filter((t) => t.column === col.id);
              const colIds = colTodos.map((t) => t.id as unknown as number);
              return (
                <SortableContext
                  key={col.id}
                  items={colIds}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn
                    column={col}
                    index={i}
                    count={colTodos.length}
                    dragOver={activeTodo?.column === col.id}
                    menu={columnMenu(col, i)}
                  >
                    {colTodos.map((todo) => (
                      <ToDoCard
                        key={todo.id}
                        todo={todo}
                        kids={todo.isEpic ? kidsOf(todo) : undefined}
                        parent={todos.find(
                          (t) => t.isEpic && t.id === todo.epic,
                        )}
                        blockers={waitingOn(todo, todos, columns)}
                        onOpenTask={setOpenTask}
                        onAddToEpic={() => openNew({ epic: todo.id })}
                        landed={(todo.id as unknown as number) === landedId}
                        onLanded={() => setLandedId(null)}
                        onOpen={() => setOpenTask(todo.id)}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              );
            })}
          </div>
          <DragOverlay>
            {activeTodo ? (
              <Card
                todo={activeTodo}
                className="shadow-lift! rotate-[1.5deg] cursor-grabbing"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </main>
  );
};

export default Main;
