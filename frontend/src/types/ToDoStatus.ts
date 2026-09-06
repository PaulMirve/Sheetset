export enum ToDoStatusId {
  Todo = 1,
  InProgress = 2,
  Done = 3,
}

export type ToDoStatus = {
  id: ToDoStatusId;
  name: string;
  label: string;
  order: number;
};
