import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DroppableColumn from "@components/DroppableColumn";
import EmptyState from "@components/EmptyState";
import MeetingModal from "@components/MeetingModal";
import { NewTaskModal, TaskDetailModal } from "@components/TaskModal";
import TaskPage from "@components/TaskPage";
import ToDoCard, { Card, EpicTaskRow } from "@components/ToDoCard";
import { useBoardDnd } from "@hooks/useBoardDnd";
import { openTaskPage, useTaskRoute } from "@hooks/useTaskRoute";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from "@hooks/useTasks";
import { Board } from "@system-types/Board";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { useState } from "react";
import {
  BoardView,
  TaskActions,
  TaskFields,
  doneColumn,
  epicTasksOf,
  newEpicTask,
  waitingOn,
} from "../tasks";
import Navbar from "./Navbar";
import { useBoardMenus } from "./useBoardMenus";

const Main = ({ board }: { board: Board }) => {
  const { columns } = board;
  const tasks = useTasks(board);
  const create = useCreateTask(board);
  const updateTask = useUpdateTask(board.id);
  const deleteTask = useDeleteTask(board.id);
  const [landedId, setLandedId] = useState<ToDoId | null>(null);
  const { todos, activeTodo, dndProps } = useBoardDnd(
    board,
    tasks.data,
    setLandedId,
  );
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
  const menus = useBoardMenus(board, todos, () => openNew({ asEpic: true }));
  const detail = todos.find((t) => t.id === openTask);
  const route = useTaskRoute();
  const page =
    route?.board === board.key
      ? todos.find((t) => t.key === route.key)
      : undefined;
  const openPage = (id: ToDoId | null) =>
    openTaskPage(todos.find((t) => t.id === id)?.key ?? null);
  const view: BoardView = {
    board,
    columns,
    todos,
    labels: [...new Set(todos.flatMap((t) => t.label ?? []))],
  };
  const done = doneColumn(columns);

  // An epic's "first tasks" become real tasks beside it, in the same column.
  const createTask = async ({ subtasks, ...fields }: TaskFields) => {
    const todo = await create.mutateAsync({
      ...fields,
      subtasks: fields.isEpic ? [] : subtasks,
    });
    setLandedId(todo.id);
    if (fields.isEpic)
      for (const st of subtasks)
        await create.mutateAsync(newEpicTask(todo, st.title));
  };

  // ponytail: no undo toast yet, the design's "Deleted · Undo" comes later.
  const removeTask = (id: ToDoId) => {
    deleteTask.mutate(id);
    setOpenTask(null);
  };

  const actionsFor = (
    todo: ToDo,
    onOpenTask: (id: ToDoId) => void,
    onDelete: () => void,
  ): TaskActions => ({
    onChange: (patch) => updateTask.mutate({ id: todo.id, patch }),
    onChangeTask: (id, patch) => updateTask.mutate({ id, patch }),
    onCreate: createTask,
    onOpenTask,
    onOpenMeeting: openMeeting,
    onDelete,
  });

  // Epics are containers, not work: they don't count towards the board's totals.
  const work = todos.filter((t) => !t.isEpic);
  const epicRows = (epic: ToDo): EpicTaskRow[] =>
    epicTasksOf(epic, todos, columns).map((t) => ({
      todo: t,
      column: columns.findIndex((c) => c.id === t.column),
      done: t.column === done,
    }));

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
          {...view}
          {...actionsFor(page, openPage, () => {
            removeTask(page.id);
            openPage(null);
          })}
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
          menu={menus.boardMenu}
          done={work.filter((t) => t.column === done).length}
          total={work.length}
          onNewTask={() => openNew()}
          onFromMeeting={() => openMeeting()}
        />
      )}
      {menus.dialogs}
      {openTask === "new" && (
        <NewTaskModal
          {...view}
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
          labels={view.labels}
          onCreated={(ids) => setLandedId(ids[0])}
          onClose={() => setOpenTask(null)}
        />
      )}
      {detail && (
        <TaskDetailModal
          key={detail.id}
          todo={detail}
          {...view}
          {...actionsFor(detail, setOpenTask, () => removeTask(detail.id))}
          onOpenPage={() => {
            setOpenTask(null);
            openPage(detail.id);
          }}
          onClose={() => setOpenTask(null)}
        />
      )}
      {page ? null : columns.length === 0 ? (
        <EmptyState icon="cols" title="Workflow unavailable" className="pb-24">
          Restart the backend to initialize this board’s fixed workflow.
        </EmptyState>
      ) : (
        <DndContext collisionDetection={closestCenter} {...dndProps}>
          <div className="flex items-start gap-3.5 overflow-auto px-7 pb-6 max-md:px-4 max-md:pb-4 max-md:snap-x max-md:snap-mandatory">
            {columns.map((col, i) => {
              const colTodos = todos.filter((t) => t.column === col.id);
              return (
                <SortableContext
                  key={col.id}
                  items={colTodos.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn
                    column={col}
                    index={i}
                    count={colTodos.length}
                    dragOver={activeTodo?.column === col.id}
                  >
                    {colTodos.map((todo) => (
                      <ToDoCard
                        key={todo.id}
                        todo={todo}
                        epicTasks={todo.isEpic ? epicRows(todo) : undefined}
                        parent={todos.find(
                          (t) => t.isEpic && t.id === todo.epic,
                        )}
                        blockers={waitingOn(todo, todos, columns)}
                        onOpenTask={setOpenTask}
                        onAddToEpic={() => openNew({ epic: todo.id })}
                        landed={todo.id === landedId}
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
