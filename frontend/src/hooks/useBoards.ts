import { Board, BoardId } from "@system-types/Board";
import { ColumnId } from "@system-types/column";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../api";
import { boardKeys, taskKeys } from "./queryKeys";

export const useBoards = () =>
  useQuery({
    queryKey: boardKeys.list(),
    queryFn: () => api<Board[]>("/boards"),
  });

// Board and column writes return the whole board; swap it into the list.
const put = (qc: QueryClient, board: Board) =>
  qc.setQueryData(boardKeys.list(), (old?: Board[]) =>
    old?.some((b) => b.id === board.id)
      ? old.map((b) => (b.id === board.id ? board : b))
      : [...(old ?? []), board],
  );

export const useCreateBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; shared: boolean }) =>
      api<Board>("/boards", body),
    onSuccess: (board) => put(qc, board),
  });
};

export const useUpdateBoard = (id: BoardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; shared?: boolean }) =>
      api<Board>(`/boards/${id}`, body, "PATCH"),
    onSuccess: (board) => put(qc, board),
  });
};

export const useDeleteBoard = (id: BoardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>(`/boards/${id}`, undefined, "DELETE"),
    onSuccess: () => {
      qc.setQueryData(boardKeys.list(), (old?: Board[]) =>
        old?.filter((b) => b.id !== id),
      );
      qc.removeQueries({ queryKey: taskKeys.board(id) });
    },
  });
};

export const useCreateColumn = (boardId: BoardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      api<Board>(`/boards/${boardId}/columns`, body),
    onSuccess: (board) => put(qc, board),
  });
};

export const useUpdateColumn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: ColumnId;
      name?: string;
      position?: number;
    }) => api<Board>(`/columns/${id}`, body, "PATCH"),
    onSuccess: (board) => put(qc, board),
  });
};

export const useDeleteColumn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ColumnId) =>
      api<Board>(`/columns/${id}`, undefined, "DELETE"),
    onSuccess: (board) => {
      put(qc, board);
      // Its tasks went with it.
      qc.invalidateQueries({ queryKey: taskKeys.board(board.id) });
    },
  });
};
