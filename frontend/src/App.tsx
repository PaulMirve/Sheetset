import Button from "@components/Button";
import EmptyState from "@components/EmptyState";
import Icon from "@components/Icon";
import { useBoards } from "@hooks/useBoards";
import { BoardId } from "@system-types/Board";
import { useState, useSyncExternalStore } from "react";
import { getToken, subscribeToken } from "./api";
import { ThemeProvider } from "./context/ThemeContext";
import Auth from "./layout/Auth";
import Main from "./layout/Main";
import Sidebar from "./layout/Sidebar";

// The last board you opened, restored on reload.
const savedBoard = () => Number(localStorage.getItem("board")) as BoardId;

const Workspace = () => {
  const boards = useBoards();
  const [picked, setPicked] = useState(savedBoard);
  const [adding, setAdding] = useState(false);
  const list = boards.data ?? [];
  // Falls back to the first board when the saved one is gone (deleted, other account).
  const board = list.find((b) => b.id === picked) ?? list[0];

  const pick = (id: BoardId) => {
    setPicked(id);
    localStorage.setItem("board", String(id));
  };

  return (
    <div className="h-full grid grid-cols-[288px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)]">
      <Sidebar
        boards={list}
        activeId={board?.id}
        onPick={pick}
        adding={adding}
        onAdding={setAdding}
      />
      {board ? (
        <Main key={board.id} board={board} />
      ) : (
        <main className="grid min-h-0">
          {boards.isSuccess && (
            <EmptyState
              icon="board"
              title="No boards yet"
              action={
                !adding && (
                  <Button onClick={() => setAdding(true)}>
                    <Icon name="plus" /> New board
                  </Button>
                )
              }
            >
              Boards hold your columns and tasks. Start with a personal one; you
              can share it later.
            </EmptyState>
          )}
        </main>
      )}
    </div>
  );
};

const App = () => {
  const token = useSyncExternalStore(subscribeToken, getToken);
  return <ThemeProvider>{token ? <Workspace /> : <Auth />}</ThemeProvider>;
};

export default App;
