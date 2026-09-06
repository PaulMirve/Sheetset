import { useDroppable } from "@dnd-kit/core";
import { ColumnId } from "@system-types/column";

type Props = {
  id: ColumnId;
  children: React.ReactNode;
};

const DroppableColumn = ({ id, children }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${id}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 mt-4 min-h-20 rounded-lg transition-colors ${
        isOver ? "bg-light-grey/60" : ""
      }`}
    >
      {children}
    </div>
  );
};

export default DroppableColumn;
