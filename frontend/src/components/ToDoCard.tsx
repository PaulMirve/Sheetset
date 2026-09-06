import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToDo } from "@system-types/ToDo";
import Typography from "./Typography";

type Props = {} & ToDo;

const ToDoCard = ({ id, title, subtasks }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: id as unknown as number });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white px-4 py-5.75 rounded-lg cursor-grab active:cursor-grabbing shadow-[0px_4px_6px_0px_rgba(54,78,126,0.1015)] ${
        isDragging ? "opacity-0" : "opacity-100"
      }`}
      {...listeners}
      {...attributes}
    >
      <Typography variant={"heading-m"}>{title}</Typography>
      <Typography className="mt-2" variant={"body-medium"} color="medium-grey">
        {subtasks.filter((st) => st.completed).length} of {subtasks.length}
      </Typography>
    </div>
  );
};

export default ToDoCard;
