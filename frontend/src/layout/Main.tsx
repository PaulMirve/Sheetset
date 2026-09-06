import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DroppableColumn from "@components/DroppableColumn";
import ToDoCard from "@components/ToDoCard";
import Typography from "@components/Typography";
import { useState } from "react";
import { COLUMNS, TODOS } from "../mocks/data";
import { ColumnId } from "@system-types/column";

const Main = () => {
  const [todos, setTodos] = useState(TODOS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeTodo = activeId != null ? (todos.find((t) => (t.id as unknown as number) === activeId) ?? null) : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as number);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;

    const activeNumId = active.id as number;
    const overIsColumn = typeof over.id === "string";

    setTodos((prev) => {
      const activeIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === activeNumId
      );
      const activeTodo = prev[activeIdx];

      if (overIsColumn) {
        const colNum = parseInt((over.id as string).replace("column-", ""), 10);
        const targetColumnId = colNum as unknown as ColumnId;
        if (activeTodo.column === targetColumnId) return prev;
        const without = prev.filter(
          (t) => (t.id as unknown as number) !== activeNumId
        );
        return [...without, { ...activeTodo, column: targetColumnId }];
      }

      const overNumId = over.id as number;
      const overIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === overNumId
      );
      const overTodo = prev[overIdx];

      if (activeTodo.column === overTodo.column) return prev;

      // Cross-column: remove active, insert at over card's position
      const without = [...prev];
      without.splice(activeIdx, 1);
      const newOverIdx = without.findIndex(
        (t) => (t.id as unknown as number) === overNumId
      );
      without.splice(newOverIdx, 0, { ...activeTodo, column: overTodo.column });
      return without;
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    // Cross-column moves already applied in onDragOver; only handle same-column reorder here
    if (!over || active.id === over.id || typeof over.id === "string") return;

    const activeNumId = active.id as number;
    const overNumId = over.id as number;

    setTodos((prev) => {
      const activeIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === activeNumId
      );
      const overIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === overNumId
      );
      if (prev[activeIdx].column !== prev[overIdx].column) return prev;
      return arrayMove(prev, activeIdx, overIdx);
    });
  };

  return (
    <div className="bg-light-grey [grid-area:main] p-6 overflow-x-auto">
      {/* <span className="flex flex-col items-center gap-8">
         <Typography color="medium-grey" variant={"heading-l"}>
          This board is empty. Create a new column to get started.
        </Typography>
        <Button>+ Add New Column</Button>
      </span> */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, 280px)` }}
        >
          {COLUMNS.map((col) => {
            const colTodos = todos.filter((t) => t.column === col.id);
            const colIds = colTodos.map((t) => t.id as unknown as number);
            return (
              <div key={col.id}>
                <div className="flex gap-3">
                  <div
                    className="rounded-full h-3.75 w-3.75"
                    style={{ backgroundColor: col.color }}
                  />
                  <Typography variant={"heading-s"} color="medium-grey">
                    {col.name.toUpperCase()} ({colTodos.length})
                  </Typography>
                </div>
                <SortableContext
                  items={colIds}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn id={col.id}>
                    {colTodos.map((todo) => (
                      <ToDoCard key={todo.id} {...todo} />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTodo ? (
            <div className="bg-white px-4 py-5.75 rounded-lg cursor-grabbing shadow-[0px_4px_6px_0px_rgba(54,78,126,0.1015)] rotate-2 opacity-95">
              <Typography variant={"heading-m"}>{activeTodo.title}</Typography>
              <Typography
                className="mt-2"
                variant={"body-medium"}
                color="medium-grey"
              >
                {activeTodo.subtasks.filter((st) => st.completed).length} of{" "}
                {activeTodo.subtasks.length}
              </Typography>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Main;
