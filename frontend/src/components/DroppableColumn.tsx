import { useDroppable } from "@dnd-kit/core";
import { Column } from "@system-types/column";
import classNames from "classnames";
import Button from "./Button";
import Icon from "./Icon";
import { hue } from "../hue";
import Typography from "./Typography";

type Props = {
  column: Column;
  index: number;
  count: number;
  dragOver: boolean;
  children: React.ReactNode;
};

const DroppableColumn = ({
  column,
  index,
  count,
  dragOver,
  children,
}: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}` });

  return (
    <section
      aria-label={column.name}
      style={hue(index + 1)}
      className={classNames(
        "lane flex flex-col flex-[0_0_clamp(264px,calc((100vw-416px)/4),340px)] max-h-full overflow-y-auto px-2 pb-2 rounded-[18px] max-md:basis-[84vw] max-md:snap-start",
        { "drag-over": dragOver || isOver },
      )}
    >
      <div className="sticky top-0 z-[2] flex items-center gap-[13px] pt-[18px] pr-1.5 pb-4 pl-2 bg-inherit">
        <span className="dot" aria-hidden />
        <Typography as="h2" variant="title" className="truncate">
          {column.name}
        </Typography>
        <span className="count-pill">{count}</span>
        <Button
          variant="icon"
          className="ml-auto"
          aria-label={`Options for ${column.name}`}
        >
          <Icon name="more" />
        </Button>
      </div>
      <div ref={setNodeRef} className="flex flex-col gap-2 min-h-16">
        {count ? (
          children
        ) : (
          <Typography
            color="muted"
            className="lane-empty grid justify-items-center gap-1 px-3 py-[18px] rounded-[14px] text-center"
          >
            <Icon name="inbox" size={20} style={{ color: "var(--h)" }} />
            <span>
              No tasks yet.
              <br />
              Drag one here or add a new one.
            </span>
          </Typography>
        )}
      </div>
    </section>
  );
};

export default DroppableColumn;
