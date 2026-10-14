import { useSyncExternalStore } from "react";

// The task page lives at #/task/WON-001 (the task's public id), so it can be linked and Back works.
const subscribe = (cb: () => void) => {
  addEventListener("hashchange", cb);
  return () => removeEventListener("hashchange", cb);
};
const useHash = () => useSyncExternalStore(subscribe, () => location.hash);

// "won", "4" → "WON-004", the stored form.
const toKey = (board: string, n: string) =>
  `${board}-${String(Number(n)).padStart(3, "0")}`;

// Pass null to go back to the board.
export const openTaskPage = (key: string | null) => {
  location.hash = key ? `/task/${key}` : "";
};

// { board: "WON", key: "WON-001" }. "#/task/won-1" works too.
export const useTaskRoute = () => {
  const m = useHash().match(/^#\/task\/([A-Z0-9]+)-(\d+)$/i);
  if (!m) return null;
  const board = m[1].toUpperCase();
  return { board, key: toKey(board, m[2]) };
};

// A board's Epics tab, or one epic's board when `epic` (its key) is given.
export const openEpics = (board: string, epic?: string) => {
  location.hash = epic
    ? `/board/${board}/epic/${epic}`
    : `/board/${board}/epics`;
};

// A board's Board tab. Epics is the default, so a board opens there.
export const openBoard = (board: string) => {
  location.hash = `/board/${board}/board`;
};

// #/board/WON/board → the Board tab; #/board/WON/epics → the Epics tab;
// #/board/WON/epic/WON-4 → one epic's board, { epic: "WON-004" }.
export const useBoardRoute = () => {
  const m = useHash().match(
    /^#\/board\/([A-Z0-9]+)\/(board|epics|epic\/[A-Z0-9]+-(\d+))$/i,
  );
  if (!m) return null;
  const board = m[1].toUpperCase();
  return {
    board,
    tab:
      m[2].toLowerCase() === "board" ? ("board" as const) : ("epics" as const),
    epic: m[3] ? toKey(board, m[3]) : undefined,
  };
};
