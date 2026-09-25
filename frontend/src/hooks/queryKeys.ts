// Query key factories. Invalidate a prefix (e.g. `meetingKeys.all`) to refetch everything under it.

export const userKeys = {
  me: () => ["me"] as const,
};

export const boardKeys = {
  all: ["boards"] as const,
  list: () => [...boardKeys.all, "list"] as const,
};

export const meetingKeys = {
  all: ["meetings"] as const,
  list: () => [...meetingKeys.all, "list"] as const,
  detail: (id: number) => [...meetingKeys.all, "detail", id] as const,
};

export const taskKeys = {
  all: ["tasks"] as const,
  board: (boardId: number) => [...taskKeys.all, "board", boardId] as const,
};
