import { Column, ColumnId } from "@system-types/column";
import { Subtask, SubtaskId } from "@system-types/Subtask";
import { ToDo, ToDoId } from "@system-types/ToDo";
import { ToDoStatusId } from "@system-types/ToDoStatus";
import { User, UserId } from "@system-types/user";

const mockUser: User = {
  id: 1 as unknown as UserId,
  first_name: "Paul",
  last_name: "Miranda",
};

const base = {
  created_at: "2026-08-27T00:00:00Z",
  updated_at: "2026-08-27T00:00:00Z",
  created_by: mockUser,
  updated_by: mockUser,
};

export const COLUMNS: Column[] = [
  {
    id: 1 as unknown as ColumnId,
    name: "Todo",
    color: "#49C4E5",
    ...base,
  },
  {
    id: 2 as unknown as ColumnId,
    name: "In Progress",
    color: "#8471F2",
    ...base,
  },
  {
    id: 3 as unknown as ColumnId,
    name: "Done",
    color: "#67E2AE",
    ...base,
  },
];

const SUBTASKS: Record<number, Subtask[]> = {
  1: [
    { id: 1 as unknown as SubtaskId, title: "Sketch main board layout", completed: true, ...base },
    { id: 2 as unknown as SubtaskId, title: "Sketch column and card", completed: false, ...base },
  ],
  4: [
    { id: 3 as unknown as SubtaskId, title: "Research dnd libraries", completed: true, ...base },
    { id: 4 as unknown as SubtaskId, title: "Implement drop zones", completed: false, ...base },
    { id: 5 as unknown as SubtaskId, title: "Handle cross-column drag", completed: false, ...base },
  ],
  5: [
    { id: 6 as unknown as SubtaskId, title: "Build card markup", completed: true, ...base },
    { id: 7 as unknown as SubtaskId, title: "Add subtask count badge", completed: false, ...base },
  ],
  6: [
    { id: 8 as unknown as SubtaskId, title: "Design modal layout", completed: false, ...base },
    { id: 9 as unknown as SubtaskId, title: "Add status select", completed: false, ...base },
    { id: 10 as unknown as SubtaskId, title: "Wire subtask checkboxes", completed: false, ...base },
  ],
  7: [
    { id: 11 as unknown as SubtaskId, title: "Define API endpoints", completed: false, ...base },
    { id: 12 as unknown as SubtaskId, title: "Add react-query hooks", completed: false, ...base },
  ],
  9: [
    { id: 13 as unknown as SubtaskId, title: "Unit test Typography", completed: false, ...base },
    { id: 14 as unknown as SubtaskId, title: "Unit test ToDoCard", completed: false, ...base },
  ],
};

export const TODOS: ToDo[] = [
  {
    id: 1 as unknown as ToDoId,
    column: COLUMNS[0].id,
    title: "Design wireframes",
    description: "Create low-fidelity wireframes for the kanban board.",
    status: { id: ToDoStatusId.Todo, name: "todo", label: "To Do", order: 1 },
    subtasks: SUBTASKS[1],
    ...base,
  },
  {
    id: 2 as unknown as ToDoId,
    column: COLUMNS[2].id,
    title: "Set up project structure",
    description: "Initialize Vite, Tailwind, and folder structure.",
    status: { id: ToDoStatusId.Done, name: "done", label: "Done", order: 3 },
    subtasks: [],
    ...base,
  },
  {
    id: 3 as unknown as ToDoId,
    column: COLUMNS[2].id,
    title: "Build sidebar component",
    description: "Sidebar with board list and toggle behavior.",
    status: { id: ToDoStatusId.Done, name: "done", label: "Done", order: 3 },
    subtasks: [],
    ...base,
  },
  {
    id: 4 as unknown as ToDoId,
    column: COLUMNS[1].id,
    title: "Implement drag and drop",
    description: "Allow cards to be dragged between columns.",
    status: { id: ToDoStatusId.InProgress, name: "in_progress", label: "In Progress", order: 2 },
    subtasks: SUBTASKS[4],
    ...base,
  },
  {
    id: 5 as unknown as ToDoId,
    column: COLUMNS[1].id,
    title: "Add todo card component",
    description: "Card showing title, subtask count, and status.",
    status: { id: ToDoStatusId.InProgress, name: "in_progress", label: "In Progress", order: 2 },
    subtasks: SUBTASKS[5],
    ...base,
  },
  {
    id: 6 as unknown as ToDoId,
    column: COLUMNS[0].id,
    title: "Create todo detail modal",
    description: "Modal with full todo info, subtasks, and status select.",
    status: { id: ToDoStatusId.Todo, name: "todo", label: "To Do", order: 1 },
    subtasks: SUBTASKS[6],
    ...base,
  },
  {
    id: 7 as unknown as ToDoId,
    column: COLUMNS[0].id,
    title: "Connect to API",
    description: "Fetch boards and todos from the backend.",
    status: { id: ToDoStatusId.Todo, name: "todo", label: "To Do", order: 1 },
    subtasks: SUBTASKS[7],
    ...base,
  },
  {
    id: 8 as unknown as ToDoId,
    column: COLUMNS[0].id,
    title: "Add authentication",
    description: "Login/logout flow with token storage.",
    status: { id: ToDoStatusId.Todo, name: "todo", label: "To Do", order: 1 },
    subtasks: [],
    ...base,
  },
  {
    id: 9 as unknown as ToDoId,
    column: COLUMNS[0].id,
    title: "Write unit tests",
    description: "Cover components and utility functions.",
    status: { id: ToDoStatusId.Todo, name: "todo", label: "To Do", order: 1 },
    subtasks: SUBTASKS[9],
    ...base,
  },
  {
    id: 10 as unknown as ToDoId,
    column: COLUMNS[0].id,
    title: "Deploy to production",
    description: "Ship to Vercel with env vars configured.",
    status: { id: ToDoStatusId.Todo, name: "todo", label: "To Do", order: 1 },
    subtasks: [],
    ...base,
  },
];
