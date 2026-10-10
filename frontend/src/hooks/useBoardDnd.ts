import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Board } from "@system-types/Board";
import { ColumnId } from "@system-types/column";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { canMove } from "../tasks";
import { taskKeys } from "./queryKeys";
import { useUpdateTask } from "./useTasks";

/** What a column's droppable carries, so a drop knows the column without parsing its id. */
export type ColumnDropData = { column: ColumnId };

/**
 * Dragging cards between and within columns. While dragging, cards move in a local copy
 * of `saved`; the server hears about it on drop. `onLand` gets the moved card's id.
 */
export const useBoardDnd = (
  board: Board,
  saved: ToDo[] | undefined,
  onLand: (id: ToDoId) => void,
) => {
  const { columns } = board;
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask(board.id);
  const [dragTodos, setDragTodos] = useState<ToDo[] | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const todos = dragTodos ?? saved ?? [];
  const activeTodo = todos.find((t) => t.id === activeId) ?? null;
  const sensors = useSensors(
    // Small distance so a click opens the card instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Enter opens the card, so only Space picks it up.
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const reset = () => {
    setActiveId(null);
    setDragTodos(null);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    setDragTodos(todos);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    const overColumn = (over.data.current as ColumnDropData | undefined)
      ?.column;

    setDragTodos((prev) => {
      if (!prev) return prev;
      const activeIdx = prev.findIndex((t) => t.id === active.id);
      const dragged = prev[activeIdx];
      // Checked against where the card started, with the board as saved.
      const base = saved ?? prev;
      const from = base.find((t) => t.id === dragged.id) ?? dragged;
      const allowed = (column: ColumnId) =>
        canMove(from, column, base, columns);

      if (overColumn !== undefined) {
        if (dragged.column === overColumn || !allowed(overColumn)) return prev;
        const without = prev.filter((t) => t.id !== active.id);
        return [...without, { ...dragged, column: overColumn }];
      }

      const overTodo = prev.find((t) => t.id === over.id);
      if (!overTodo || dragged.column === overTodo.column) return prev;
      if (!allowed(overTodo.column)) return prev;

      // Cross-column: remove the dragged card, insert it where the hovered card is.
      const without = prev.filter((t) => t.id !== active.id);
      without.splice(
        without.findIndex((t) => t.id === over.id),
        0,
        { ...dragged, column: overTodo.column },
      );
      return without;
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const dragged = dragTodos;
    reset();
    if (!over || !dragged) return;

    // Cross-column moves already happened in onDragOver; only a same-column reorder is left.
    let next = dragged;
    const activeIdx = next.findIndex((t) => t.id === active.id);
    const overIdx = next.findIndex((t) => t.id === over.id);
    if (overIdx >= 0 && next[activeIdx].column === next[overIdx].column)
      next = arrayMove(next, activeIdx, overIdx);

    // Index within its column, before and after the drag.
    const indexIn = (list: ToDo[], t: ToDo) =>
      list.filter((x) => x.column === t.column).findIndex((x) => x.id === t.id);
    const moved = next.find((t) => t.id === active.id)!;
    onLand(moved.id);
    const was = saved?.find((t) => t.id === moved.id);
    const position = indexIn(next, moved);
    if (was && was.column === moved.column && indexIn(saved!, was) === position)
      return;

    queryClient.setQueryData(taskKeys.board(board.id), next);
    updateTask.mutate({
      id: moved.id,
      patch: { column: moved.column },
      position,
    });
  };

  return {
    todos,
    activeTodo,
    dndProps: {
      sensors,
      onDragStart,
      onDragOver,
      onDragEnd,
      onDragCancel: reset,
    },
  };
};
