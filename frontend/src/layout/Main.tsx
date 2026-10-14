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
import Button from "@components/Button";
import Icon from "@components/Icon";
import ToDoCard, { Card } from "@components/ToDoCard";
import { useBoardDnd } from "@hooks/useBoardDnd";
import { useMe } from "@hooks/useMe";
import {
  openBoard,
  openEpics,
  openTaskPage,
  useBoardRoute,
  useTaskRoute,
} from "@hooks/useTaskRoute";
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
  newEpicTask,
  waitingOn,
} from "../tasks";
import { EmptyEpic, EpicHeader, EpicList, TaskFilter, epicsOf } from "./Epics";
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
  const menus = useBoardMenus(board, todos);
  const me = useMe().data;
  const [filter, setFilter] = useState<TaskFilter>("all");
  const detail = todos.find((t) => t.id === openTask);
  const route = useTaskRoute();
  const page =
    route?.board === board.key
      ? todos.find((t) => t.key === route.key)
      : undefined;
  const openPage = (id: ToDoId | null) =>
    openTaskPage(todos.find((t) => t.id === id)?.key ?? null);
  // Epics is the default tab; the Board tab and an epic's board have their own links.
  const boardRoute = useBoardRoute();
  const here = boardRoute?.board === board.key ? boardRoute : null;
  const tab = here?.tab ?? "epics";
  const epics = epicsOf(todos, columns);
  const entry = epics.find((e) => here?.epic && e.epic.key === here.epic);
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

  // Epics are containers, not work: they live in the Epics tab, not in the columns.
  const work = todos.filter((t) => !t.isEpic);
  const stuck = (t: ToDo) =>
    t.isBlocked || waitingOn(t, todos, columns).length > 0;
  const filters: Record<TaskFilter, (t: ToDo) => boolean> = {
    all: () => true,
    blocked: stuck,
    review: (t) => t.needsHumanReview,
    mine: (t) => !!me && t.assignee?.id === me.id,
  };
  const inEpic = entry ? entry.stats.tasks : [];
  const visible = entry
    ? (t: ToDo) => t.epic === entry.epic.id && filters[filter](t)
    : (t: ToDo) => !t.isEpic;

  return (
    <main
      className={
        page || entry
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
            if (page.isEpic) openEpics(board.key);
            else openBoard(board.key);
          })}
          // A task goes back to the Board tab, an epic to its own board.
          onBack={() =>
            page.isEpic ? openEpics(board.key, page.key) : openBoard(board.key)
          }
          onShowOnBoard={() => {
            if (page.isEpic) return openEpics(board.key, page.key);
            setLandedId(page.id);
            openBoard(board.key);
          }}
        />
      ) : entry ? null : (
        <Navbar
          board={board}
          columns={columns.length}
          menu={menus.boardMenu}
          done={work.filter((t) => t.column === done).length}
          total={work.length}
          tab={tab}
          epics={epics.filter((e) => e.stats.status !== "done").length}
        >
          {tab === "epics" ? (
            <Button onClick={() => openNew({ asEpic: true })}>
              <Icon name="plus" /> New epic
            </Button>
          ) : (
            <>
              {/* Tasks need a column to land in. */}
              <Button
                variant="secondary"
                onClick={() => openMeeting()}
                disabled={columns.length === 0}
              >
                <Icon name="spark" /> From meeting
              </Button>
              <Button onClick={() => openNew()} disabled={columns.length === 0}>
                <Icon name="plus" /> New task
              </Button>
            </>
          )}
        </Navbar>
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
      {page ? null : tab === "epics" && !entry ? (
        <EpicList
          board={board}
          columns={columns}
          todos={todos}
          onNewEpic={() => openNew({ asEpic: true })}
        />
      ) : columns.length === 0 ? (
        <EmptyState icon="cols" title="Workflow unavailable" className="pb-24">
          Restart the backend to initialize this board’s fixed workflow.
        </EmptyState>
      ) : (
        <div className={entry ? "min-h-0 overflow-auto" : "contents"}>
          {entry && (
            <EpicHeader
              key={entry.epic.id}
              board={board}
              columns={columns}
              entries={epics}
              entry={entry}
              filter={filter}
              counts={{
                all: inEpic.length,
                blocked: inEpic.filter(filters.blocked).length,
                review: inEpic.filter(filters.review).length,
                mine: inEpic.filter(filters.mine).length,
              }}
              onFilter={setFilter}
              onChange={(patch) =>
                updateTask.mutate({ id: entry.epic.id, patch })
              }
              onNewTask={() => openNew({ epic: entry.epic.id })}
              onActivity={() => openPage(entry.epic.id)}
            />
          )}
          {entry && !inEpic.length ? (
            <EmptyEpic
              epic={entry.epic}
              onNewTask={() => openNew({ epic: entry.epic.id })}
            />
          ) : (
            <DndContext collisionDetection={closestCenter} {...dndProps}>
              <div className="flex items-start gap-3.5 overflow-auto px-7 pb-6 max-md:px-4 max-md:pb-4 max-md:snap-x max-md:snap-mandatory">
                {columns.map((col, i) => {
                  // Drags work on every task, so positions stay right; only the visible ones show.
                  const colTodos = todos.filter(
                    (t) => t.column === col.id && visible(t),
                  );
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
                            // On an epic's board every card shares the epic, so the chip goes.
                            parent={
                              entry
                                ? undefined
                                : todos.find(
                                    (t) => t.isEpic && t.id === todo.epic,
                                  )
                            }
                            blockers={waitingOn(todo, todos, columns)}
                            onOpenEpic={() => {
                              const epic = todos.find(
                                (t) => t.id === todo.epic,
                              );
                              if (epic) openEpics(board.key, epic.key);
                            }}
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
        </div>
      )}
    </main>
  );
};

export default Main;
