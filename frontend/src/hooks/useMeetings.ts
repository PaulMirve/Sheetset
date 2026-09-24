import { Meeting, MeetingSummary } from "@system-types/meeting";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const useMeetings = () =>
  useQuery({
    queryKey: ["meetings"],
    queryFn: () => api<MeetingSummary[]>("/meetings"),
  });

export const useMeeting = (id?: number) =>
  useQuery({
    queryKey: ["meetings", id],
    queryFn: () => api<Meeting>(`/meetings/${id}`),
    enabled: id != null,
  });
