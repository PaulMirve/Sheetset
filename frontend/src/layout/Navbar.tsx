import Button from "@components/Button";
import Icon from "@components/Icon";
import Menu, { MenuItem } from "@components/Menu";
import Typography from "@components/Typography";
import { Board } from "@system-types/Board";
import { hashHue } from "../hue";

type Props = {
  board: Board;
  columns: number;
  done: number;
  total: number;
  menu: MenuItem[];
  onNewTask: () => void;
  onFromMeeting: () => void;
};

const Navbar = ({
  board,
  columns,
  done,
  total,
  menu,
  onNewTask,
  onFromMeeting,
}: Props) => (
  <header className="flex items-center justify-between gap-6 px-7 pt-6 pb-5 max-md:flex-col max-md:items-start max-md:gap-3.5 max-md:px-4 max-md:pt-[18px] max-md:pb-3.5">
    <div className="flex items-center gap-3.5 min-w-0">
      <span
        className="tile w-12 h-12 rounded-[14px] text-[22px]"
        style={hashHue(String(board.id))}
        aria-hidden
      >
        {board.name[0].toUpperCase()}
      </span>
      <div className="min-w-0">
        <Typography as="h1" variant="headline">
          {board.name}
        </Typography>
        <Typography
          color="muted"
          className="flex items-center flex-wrap gap-x-3.5 gap-y-2 mt-1.5 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
        >
          <span>
            <Icon name={board.shared ? "users" : "lock"} />
            {board.shared ? "Shared" : "Only you"}
          </span>
          <span>
            <Icon name="cols" />
            {columns} columns
          </span>
          <span className="max-lg:hidden! tabular-nums">
            <span className="w-24 h-1.5 rounded-full bg-line-strong overflow-hidden">
              <i
                className="block h-full rounded-full bg-(--hue-4) transition-[width] duration-300 ease-out"
                style={{
                  width: `${total ? Math.round((done / total) * 100) : 0}%`,
                }}
              />
            </span>
            {done} of {total} done
          </span>
        </Typography>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-none max-md:flex-wrap">
      {/* Tasks need a column to land in. */}
      <Button
        variant="secondary"
        onClick={onFromMeeting}
        disabled={columns === 0}
      >
        <Icon name="spark" /> From meeting
      </Button>
      <Button onClick={onNewTask} disabled={columns === 0}>
        <Icon name="plus" /> New task
      </Button>
      <Menu label="Board options" items={menu} />
    </div>
  </header>
);

export default Navbar;
