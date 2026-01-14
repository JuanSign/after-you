export enum Priority {
  High = 0,
  Normal = 1,
  Low = 2,
  Idle = 3,
}

export type TaskCallback = () => void | Promise<void>;

export interface TaskNode {
  task: TaskCallback;
  priority: Priority;
  id: number;
  next: TaskNode | null;
}
