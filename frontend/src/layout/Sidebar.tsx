import Toggle from "@components/Toggle";
import Logo from "./Logo";
import { useTheme } from "@context/ThemeContext";
import Typography from "@components/Typography";
import Icon from "@components/Icon";
import { Board, BoardId } from "@system-types/Board";
import { brand } from "@system-types/Brand";
import classNames from "classnames";

const BOARDS: Board[] = [
  {
    id: brand<BoardId>(1),
    name: "Platform Launch",
  },
  {
    id: brand<BoardId>(2),
    name: "Marketing Plan",
  },
  {
    id: brand<BoardId>(3),
    name: "Roadmap",
  },
];

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="h-full bg-white w-75 border-r-lines border-r flex flex-col py-8 pr-6">
      <div className="px-8.5">
        <Logo />
      </div>
      <Typography
        variant={"heading-s"}
        color="medium-grey"
        className="mt-13.5 pl-8"
      >
        ALL BOARDS (3)
      </Typography>
      <div className="mt-4.5">
        {BOARDS.map((board, i) => {
          return (
            <BoardRow
              key={board.id}
              id={board.id}
              name={board.name}
              active={i === 0}
            />
          );
        })}
        <div className="flex items-center ml-8 gap-4 h-12 cursor-pointer ">
          <Icon name="board" color="main-purple" />
          <Typography color="main-purple" variant={"heading-m"}>
            + Create New Board
          </Typography>
        </div>
      </div>
      <div className="mt-auto bg-light-grey rounded-md h-12 flex items-center justify-center mx-6 gap-6">
        <Icon name="sun" />
        <Toggle
          className=""
          active={theme === "dark"}
          onClick={() => {
            toggleTheme();
          }}
        />
        <Icon name="moon" />
      </div>
    </div>
  );
};

type BoardRowProps = { active?: boolean } & Board;

const BoardRow = ({ active, name }: BoardRowProps) => {
  return (
    <div
      className={classNames(
        "flex gap-4 pl-8 h-12 items-center rounded-r-full cursor-pointer",
        {
          "bg-main-purple": active,
        },
      )}
    >
      <Icon name="board" size={18} color={active ? "white" : "medium-grey"} />
      <Typography
        variant={"heading-m"}
        color={active ? "white" : "medium-grey"}
      >
        {name}
      </Typography>
    </div>
  );
};

export default Sidebar;
