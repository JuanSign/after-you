import { Priority, TaskCallback, TaskNode } from './types';
import { LinkedQueue } from './queue';
import { isBrowser, hasScheduler, hasMessageChannel } from '../core/env';
import {
  yieldWithPostTask,
  yieldWithMessageChannel,
  yieldWithSetTimeout,
} from '../yielder/strategies';

export { Priority };

export class Scheduler {
  private queues: Record<Priority, LinkedQueue> = {
    [Priority.High]: new LinkedQueue(),
    [Priority.Normal]: new LinkedQueue(),
    [Priority.Low]: new LinkedQueue(),
    [Priority.Idle]: new LinkedQueue(),
  };

  private isRunning = false;
  private taskIdCounter = 0;
  private cancelledTaskIds = new Set<number>();

  private frameBudget = 5;

  addTask(callback: TaskCallback, priority: Priority = Priority.Normal): number {
    const id = ++this.taskIdCounter;

    this.queues[priority].push(callback, priority, id);

    if (!this.isRunning && isBrowser) this.startWorkLoop();

    return id;
  }

  cancelTask(id: number) {
    this.cancelledTaskIds.add(id);
  }

  private async startWorkLoop() {
    this.isRunning = true;

    await Promise.resolve();

    while (this.hasPendingWork()) {
      const frameStart = performance.now();

      while (this.hasPendingWork() && performance.now() - frameStart < this.frameBudget) {
        const node = this.getNextTaskNode();

        if (node) {
          if (this.cancelledTaskIds.has(node.id)) {
            this.cancelledTaskIds.delete(node.id);
            continue;
          }

          try {
            const result = node.task();
            if (result instanceof Promise) await result;
          } catch (error) {
            console.error('Scheduler Task Failed:', error);
          }
        }
      }

      if (hasScheduler) {
        // @ts-ignore
        await yieldWithPostTask('user-visible');
      } else if (hasMessageChannel) {
        await yieldWithMessageChannel();
      } else {
        await yieldWithSetTimeout();
      }
    }

    this.isRunning = false;
  }

  private getNextTaskNode(): TaskNode | null {
    if (!this.queues[Priority.High].isEmpty()) return this.queues[Priority.High].shift();
    if (!this.queues[Priority.Normal].isEmpty()) return this.queues[Priority.Normal].shift();
    if (!this.queues[Priority.Low].isEmpty()) return this.queues[Priority.Low].shift();
    if (!this.queues[Priority.Idle].isEmpty()) return this.queues[Priority.Idle].shift();
    return null;
  }

  private hasPendingWork(): boolean {
    return (
      !this.queues[Priority.High].isEmpty() ||
      !this.queues[Priority.Normal].isEmpty() ||
      !this.queues[Priority.Low].isEmpty() ||
      !this.queues[Priority.Idle].isEmpty()
    );
  }
}

export const globalScheduler = new Scheduler();
