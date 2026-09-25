import { useSyncExternalStore } from "react";

// The task page lives at #/task/WON-001 (the task's public id), so it can be linked and Back works.
const subscribe = (cb: () => void) => {
  addEventListener("hashchange", cb);
  return () => removeEventListener("hashchange", cb);
};

// Pass null to go back to the board.
export const openTaskPage = (key: string | null) => {
  location.hash = key ? `/task/${key}` : "";
};

// { board: "WON", key: "WON-001" }. "#/task/won-1" works too.
export const useTaskRoute = () => {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  const m = hash.match(/^#\/task\/([A-Z0-9]+)-(\d+)$/i);
  if (!m) return null;
  const board = m[1].toUpperCase();
  return { board, key: `${board}-${String(Number(m[2])).padStart(3, "0")}` };
};
