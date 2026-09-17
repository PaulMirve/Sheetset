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
import ToDoCard, { Card } from "@components/ToDoCard";
import Navbar from "./Navbar";
import { useState } from "react";
import { BOARDS, COLUMNS, TODOS } from "../mocks/data";
import { ColumnId } from "@system-types/column";

const Main = () => {
  const [todos, setTodos] = useState(TODOS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [landedId, setLandedId] = useState<number | null>(null);
  const activeTodo =
    activeId != null
      ? (todos.find((t) => (t.id as unknown as number) === activeId) ?? null)
      : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as number);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;

    const activeNumId = active.id as number;
    const overIsColumn = typeof over.id === "string";

    setTodos((prev) => {
      const activeIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === activeNumId,
      );
      const activeTodo = prev[activeIdx];

      if (overIsColumn) {
        const colNum = parseInt((over.id as string).replace("column-", ""), 10);
        const targetColumnId = colNum as unknown as ColumnId;
        if (activeTodo.column === targetColumnId) return prev;
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
    if (over) setLandedId(active.id as number);
    // Cross-column moves already applied in onDragOver; only handle same-column reorder here
    if (!over || active.id === over.id || typeof over.id === "string") return;

    const activeNumId = active.id as number;
    const overNumId = over.id as number;

    setTodos((prev) => {
      const activeIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === activeNumId,
      );
      const overIdx = prev.findIndex(
        (t) => (t.id as unknown as number) === overNumId,
      );
      if (prev[activeIdx].column !== prev[overIdx].column) return prev;
      return arrayMove(prev, activeIdx, overIdx);
    });
  };

  const lastColumn = COLUMNS[COLUMNS.length - 1].id;

  return (
    <main className="min-w-0 min-h-0 grid grid-rows-[auto_minmax(0,1fr)]">
      <Navbar
        board={BOARDS[0]}
        columns={COLUMNS.length}
        done={todos.filter((t) => t.column === lastColumn).length}
        total={todos.length}
      />
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex items-start gap-3.5 overflow-auto px-7 pb-6 max-md:px-4 max-md:pb-4 max-md:snap-x max-md:snap-mandatory">
          {COLUMNS.map((col, i) => {
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
                >
                  {colTodos.map((todo) => (
                    <ToDoCard
                      key={todo.id}
                      todo={todo}
                      landed={(todo.id as unknown as number) === landedId}
                      onLanded={() => setLandedId(null)}
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
    </main>
  );
};

export default Main;
