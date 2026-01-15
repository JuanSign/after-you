import { TaskNode, TaskCallback, Priority } from './types';

export class LinkedQueue {
  private head: TaskNode | null = null;
  private tail: TaskNode | null = null;
  private length = 0;

  push(task: TaskCallback, priority: Priority, id: number) {
    const node: TaskNode = { task, priority, id, next: null };

    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail!.next = node;
      this.tail = node;
    }
    this.length++;
  }

  shift(): TaskNode | null {
    if (!this.head) return null;

    const node = this.head;
    this.head = this.head.next;

    if (!this.head) {
      this.tail = null;
    }

    this.length--;

    node.next = null;

    return node;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  peek(): TaskNode | null {
    return this.head;
  }
}
