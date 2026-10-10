import classNames from "classnames";
import { useTheme } from "@context/ThemeContext";
import Typography from "@components/Typography";
import Icon from "@components/Icon";
import Button from "@components/Button";
import Avatar from "@components/Avatar";
import Checkbox from "@components/Checkbox";
import Menu from "@components/Menu";
import Input from "@components/Input";
import { Board, BoardId } from "@system-types/Board";
import type { IconName } from "@system-types/IconName";
import { useCreateBoard } from "@hooks/useBoards";
import { useMe } from "@hooks/useMe";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@system-types/user";
import { FormEvent, useState } from "react";
import { setToken } from "../api";
import { boardSchema, errorsOf } from "../forms";
import { hashHue, hue } from "../hue";

type Props = {
  boards: Board[];
  activeId?: BoardId;
  onPick: (id: BoardId) => void;
  /** The New board form is open. Lifted so the empty board area can open it too. */
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  adding: boolean;
  onAdding: (open: boolean) => void;
};

const Sidebar = ({
  boards,
  activeId,
  onPick,
  adding,
  onAdding,
  collapsed,
  onCollapse,
}: Props) => {
  const { data: me } = useMe();
  const group = { activeId, onPick, collapsed };
  return (
    <nav
      aria-label="Boards"
      className="flex flex-col min-h-0 bg-rail border-r border-line max-md:border-r-0 max-md:border-b max-md:max-h-[32vh]"
    >
      <div
        className={classNames(
          "flex items-center gap-2.5 pt-[18px] pb-2 max-md:pt-3 max-md:pb-1",
          collapsed ? "justify-center px-3" : "px-[18px] max-md:px-4",
        )}
      >
        {!collapsed && (
          <span className="tile w-[30px] h-[30px] rounded-[9px]" style={hue(1)}>
            <Icon name="board" />
          </span>
        )}
        {!collapsed && (
          <Typography as="span" variant="brand" className="flex-1">
            Sheetset
          </Typography>
        )}
        <Button
          variant="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar-boards"
          disabled={adding}
          onClick={() => onCollapse(!collapsed)}
        >
          <Icon name={collapsed ? "arrow" : "arrow-left"} />
        </Button>
      </div>
      <div
        id="sidebar-boards"
        className={classNames("flex-1 overflow-auto px-3 pt-1 pb-4", {
          "max-md:hidden": collapsed,
        })}
      >
        <BoardGroup
          title="Personal"
          icon="lock"
          boards={boards.filter((b) => !b.shared)}
          {...group}
        />
        <BoardGroup
          title="Shared with team"
          icon="users"
          boards={boards.filter((b) => b.shared)}
          {...group}
        />
        {adding ? (
          <NewBoard
            onClose={() => onAdding(false)}
            onCreated={(b) => {
              onAdding(false);
              onPick(b.id);
            }}
          />
        ) : (
          <Button
            variant="quiet"
            className={classNames(
              "mt-2 w-full",
              collapsed ? "justify-center px-0" : "justify-start",
            )}
            aria-label="New board"
            title={collapsed ? "New board" : undefined}
            onClick={() => onAdding(true)}
          >
            <Icon name="plus" /> {!collapsed && "New board"}
          </Button>
        )}
      </div>
      {me && (
        <div
          className={classNames(
            "border-t border-line max-md:py-1",
            collapsed ? "p-1 max-md:hidden" : "p-3",
          )}
        >
          <AccountMenu me={me} collapsed={collapsed} />
        </div>
      )}
    </nav>
  );
};

// On phones the rail is short, so the trigger drops the email.
const Who = ({ me, short }: { me: User; short?: boolean }) => (
  <div className="min-w-0">
    <Typography variant="label" className="truncate">
      {me.first_name} {me.last_name}
    </Typography>
    <Typography
      variant="chip"
      color="muted"
      className={classNames("truncate", { "max-md:hidden": short })}
    >
      {me.email}
    </Typography>
  </div>
);

// The signed-in person at the foot of the rail; their menu holds theme and sign out.
const AccountMenu = ({ me, collapsed }: { me: User; collapsed: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  return (
    <Menu
      label="Account"
      align="start"
      trigger={
        <>
          <Avatar user={me} size="lg" />
          {!collapsed && (
            <span className="flex-1 min-w-0">
              <Who me={me} short />
            </span>
          )}
          {!collapsed && <Icon name="chev" className="flex-none text-muted" />}
        </>
      }
      header={
        <>
          <Avatar user={me} />
          <Who me={me} />
        </>
      }
      items={[
        {
          icon: "theme",
          label:
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
          onSelect: toggleTheme,
        },
        "-",
        {
          icon: "out",
          label: "Sign out",
          onSelect: () => {
            location.hash = "";
            setToken(null);
            // The next account mustn't see this one's boards.
            queryClient.clear();
          },
        },
      ]}
    />
  );
};

// Inline form under the board list, as in the wireframe.
const NewBoard = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (board: Board) => void;
}) => {
  const create = useCreateBoard();
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = boardSchema.safeParse({
      name: f.get("name"),
      shared: f.get("shared") === "on",
    });
    if (!r.success) return setError(errorsOf(r.error).name);
    create.mutate(r.data, {
      onSuccess: onCreated,
      onError: (err) => setError(`Couldn’t create the board: ${err.message}`),
    });
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="grid gap-2.5 mt-2.5 p-3 rounded-[14px] bg-ground"
    >
      <Input
        name="name"
        label="Board name"
        placeholder="e.g. Spring launch"
        maxLength={60}
        autoComplete="off"
        autoFocus
        className="bg-surface!"
        error={error}
        onChange={() => setError(undefined)}
      />
      <Checkbox name="shared" label="Share with team" />
      <div className="flex justify-end gap-1.5">
        <Button variant="quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending}>
          Create board
        </Button>
      </div>
    </form>
  );
};

type BoardGroupProps = {
  title: string;
  collapsed: boolean;
  icon: IconName;
  boards: Board[];
  activeId?: BoardId;
  onPick: (id: BoardId) => void;
};

const BoardGroup = ({
  collapsed,
  title,
  icon,
  boards,
  activeId,
  onPick,
}: BoardGroupProps) => (
  <div className="mt-[18px] max-md:mt-2">
    <div
      title={title}
      className={classNames(
        "flex items-center px-2 pb-1.5",
        collapsed ? "justify-center" : "justify-between",
      )}
    >
      <Typography
        as="span"
        variant="label"
        color="muted"
        className="inline-flex items-center gap-1.5"
      >
        <Icon name={icon} size={15} />
        <span className={collapsed ? "sr-only" : undefined}>{title}</span>
      </Typography>
      {!collapsed && (
        <Typography
          as="span"
          variant="chip"
          color="muted"
          className="bg-ground rounded-full px-2 py-1"
        >
          {boards.length}
        </Typography>
      )}
    </div>
    {boards.map((board) => (
      <Button
        variant="bare"
        key={board.id}
        className="rail-row group flex items-center gap-2.5 w-full px-2 py-1.5 mb-0.5 rounded-[10px] text-left hover:bg-ground transition-colors duration-150"
        style={hashHue(String(board.id))}
        aria-label={board.name}
        title={collapsed ? board.name : undefined}
        aria-current={board.id === activeId ? "page" : undefined}
        onClick={() => onPick(board.id)}
      >
        <span className="tile w-[30px] h-[30px] rounded-lg text-[13.5px]">
          {board.name[0].toUpperCase()}
        </span>
        <Typography
          as="span"
          variant="rail"
          className={collapsed ? "sr-only" : "flex-1 min-w-0 truncate"}
        >
          {board.name}
        </Typography>
      </Button>
    ))}
  </div>
);

export default Sidebar;
