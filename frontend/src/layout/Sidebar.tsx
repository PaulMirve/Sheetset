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
  adding: boolean;
  onAdding: (open: boolean) => void;
};

const Sidebar = ({ boards, activeId, onPick, adding, onAdding }: Props) => {
  const { data: me } = useMe();
  const group = { activeId, onPick };
  return (
    <nav
      aria-label="Boards"
      className="flex flex-col min-h-0 bg-rail border-r border-line max-md:border-r-0 max-md:border-b max-md:max-h-[32vh]"
    >
      <div className="flex items-center gap-2.5 px-[18px] pt-[18px] pb-2 max-md:px-4 max-md:pt-3 max-md:pb-1">
        <span className="tile w-[30px] h-[30px] rounded-[9px]" style={hue(1)}>
          <Icon name="board" />
        </span>
        <Typography as="span" variant="brand">
          Sheetset
        </Typography>
      </div>
      <div className="flex-1 overflow-auto px-3 pt-1 pb-4">
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
            className="mt-2 w-full justify-start"
            onClick={() => onAdding(true)}
          >
            <Icon name="plus" /> New board
          </Button>
        )}
      </div>
      {me && (
        <div className="p-3 border-t border-line max-md:py-1">
          <AccountMenu me={me} />
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
const AccountMenu = ({ me }: { me: User }) => {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  return (
    <Menu
      label="Account"
      align="start"
      trigger={
        <>
          <Avatar user={me} size="lg" />
          <span className="flex-1 min-w-0">
            <Who me={me} short />
          </span>
          <Icon name="chev" className="flex-none text-muted" />
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
  icon: IconName;
  boards: Board[];
  activeId?: BoardId;
  onPick: (id: BoardId) => void;
};

const BoardGroup = ({
  title,
  icon,
  boards,
  activeId,
  onPick,
}: BoardGroupProps) => (
  <div className="mt-[18px] max-md:mt-2">
    <div className="flex items-center justify-between px-2 pb-1.5">
      <Typography
        as="span"
        variant="label"
        color="muted"
        className="inline-flex items-center gap-1.5"
      >
        <Icon name={icon} size={15} />
        {title}
      </Typography>
      <Typography
        as="span"
        variant="chip"
        color="muted"
        className="bg-ground rounded-full px-2 py-1"
      >
        {boards.length}
      </Typography>
    </div>
    {boards.map((board) => (
      <Button
        variant="bare"
        key={board.id}
        className="rail-row group flex items-center gap-2.5 w-full px-2 py-1.5 mb-0.5 rounded-[10px] text-left hover:bg-ground transition-colors duration-150"
        style={hashHue(String(board.id))}
        aria-current={board.id === activeId ? "page" : undefined}
        onClick={() => onPick(board.id)}
      >
        <span className="tile w-[30px] h-[30px] rounded-lg text-[13.5px]">
          {board.name[0].toUpperCase()}
        </span>
        <Typography
          as="span"
          variant="rail"
          className="flex-1 min-w-0 truncate"
        >
          {board.name}
        </Typography>
      </Button>
    ))}
  </div>
);

export default Sidebar;
