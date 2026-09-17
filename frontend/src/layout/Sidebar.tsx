import Toggle from "@components/Toggle";
import { useTheme } from "@context/ThemeContext";
import Typography from "@components/Typography";
import Icon from "@components/Icon";
import Button from "@components/Button";
import { Board } from "@system-types/Board";
import type { IconName } from "@system-types/IconName";
import { BOARDS } from "../mocks/data";
import { hashHue, hue } from "../hue";

const ACTIVE_BOARD = BOARDS[0].id;

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav
      aria-label="Boards"
      className="flex flex-col min-h-0 bg-rail border-r border-line max-md:border-r-0 max-md:border-b max-md:max-h-[32vh]"
    >
      <div className="flex items-center gap-2.5 px-[18px] pt-[18px] pb-2 max-md:px-4 max-md:pt-3 max-md:pb-1">
        <span className="tile w-[30px] h-[30px] rounded-[9px]" style={hue(1)}>
          <Icon name="board" />
        </span>
        <span className="font-extrabold text-[18px] tracking-[-0.02em]">
          Sheetset
        </span>
      </div>
      <div className="flex-1 overflow-auto px-3 pt-1 pb-4">
        <BoardGroup
          title="Personal"
          icon="lock"
          boards={BOARDS.filter((b) => !b.shared)}
        />
        <BoardGroup
          title="Shared with team"
          icon="users"
          boards={BOARDS.filter((b) => b.shared)}
        />
        <Button variant="quiet" disabled className="mt-2 w-full justify-start">
          <Icon name="plus" /> New board
        </Button>
      </div>
      <div className="flex items-center gap-2.5 p-3 px-5 border-t border-line text-muted">
        <Icon name="theme" />
        <Typography variant="label" color="muted" className="flex-1">
          Dark mode
        </Typography>
        <Toggle
          active={theme === "dark"}
          onClick={toggleTheme}
          aria-label="Dark mode"
        />
      </div>
    </nav>
  );
};

type BoardGroupProps = { title: string; icon: IconName; boards: Board[] };

const BoardGroup = ({ title, icon, boards }: BoardGroupProps) => (
  <div className="mt-[18px] max-md:mt-2">
    <div className="flex items-center justify-between px-2 pb-1.5">
      <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted">
        <Icon name={icon} size={15} />
        {title}
      </span>
      <span className="text-[12px] font-bold text-muted bg-ground rounded-full px-2 py-px tabular-nums">
        {boards.length}
      </span>
    </div>
    {boards.map((board) => (
      <button
        key={board.id}
        className="rail-row group flex items-center gap-2.5 w-full px-2 py-1.5 mb-0.5 rounded-[10px] text-left hover:bg-ground transition-colors duration-150"
        style={hashHue(String(board.id))}
        aria-current={board.id === ACTIVE_BOARD ? "page" : undefined}
      >
        <span className="tile w-[30px] h-[30px] rounded-lg text-[13.5px]">
          {board.name[0].toUpperCase()}
        </span>
        <span className="flex-1 min-w-0 truncate font-[550] group-aria-[current=page]:font-bold">
          {board.name}
        </span>
      </button>
    ))}
  </div>
);

export default Sidebar;
