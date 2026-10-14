import Icon from "@components/Icon";
import Menu, { MenuItem } from "@components/Menu";
import Segmented from "@components/Segmented";
import Typography from "@components/Typography";
import { openBoard, openEpics } from "@hooks/useTaskRoute";
import { Board } from "@system-types/Board";
import { ReactNode } from "react";
import { hashHue } from "../hue";

type Props = {
  board: Board;
  columns: number;
  done: number;
  total: number;
  menu: MenuItem[];
  tab: "board" | "epics";
  // Open epics, counted on the Epics tab.
  epics: number;
  // The tab's own actions, left of the board menu.
  children: ReactNode;
};

const Navbar = ({
  board,
  columns,
  done,
  total,
  menu,
  tab,
  epics,
  children,
}: Props) => (
  <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-7 pt-6 pb-5 max-md:flex-col max-md:items-start max-md:gap-3.5 max-md:px-4 max-md:pt-[18px] max-md:pb-3.5">
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
      {children}
      <Menu label="Board options" items={menu} />
    </div>
    {/* Its own row, under the title. */}
    <div className="w-full">
      <Segmented
        label="View"
        className="w-fit max-md:w-full [&>label]:flex-auto [&>label]:px-4 [&>label]:whitespace-nowrap"
        options={[
          { value: "board", label: "Board", icon: "board" },
          { value: "epics", label: `Epics · ${epics}`, icon: "layers" },
        ]}
        value={tab}
        onChange={(v) =>
          v === "epics" ? openEpics(board.key) : openBoard(board.key)
        }
      />
    </div>
  </header>
);

export default Navbar;
