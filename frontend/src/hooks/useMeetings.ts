import { Meeting, MeetingSummary } from "@system-types/meeting";
import { Task } from "@system-types/task";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { meetingKeys, taskKeys } from "./queryKeys";

// Meetings on this board that the signed-in user attended.
export const useMeetings = (boardId: number) =>
  useQuery({
    queryKey: meetingKeys.list(boardId),
    queryFn: () => api<MeetingSummary[]>(`/meetings?board_id=${boardId}`),
  });

export const useMeeting = (id?: number) =>
  useQuery({
    queryKey: meetingKeys.detail(id!),
    queryFn: () => api<Meeting>(`/meetings/${id}`),
    enabled: id != null,
  });

export type Acceptance = {
  i: number; // index into the meeting's tasks
  column_id: number;
  title: string;
  description: string;
  due: string | null;
  label: string | null;
};

// Turns suggestions into board tasks, one at a time so their numbers follow the list order.
export const useAcceptSuggestions = (meetingId: number, boardId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (list: Acceptance[]) => {
      const tasks: Task[] = [];
      for (const { i, ...fields } of list)
        tasks.push(
          await api<Task>(`/meetings/${meetingId}/tasks/${i}/accept`, {
            board_id: boardId,
            ...fields,
          }),
        );
      return tasks;
    },
    // Also on error: the ones before the failure were created.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: meetingKeys.detail(meetingId) });
      qc.invalidateQueries({ queryKey: taskKeys.board(boardId) });
    },
  });
};
