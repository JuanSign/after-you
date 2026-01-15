import { Priority, TaskCallback, TaskNode } from './types';
import { LinkedQueue } from './queue';
import { isBrowser, hasSchedulerYield, hasSchedulerPostTask, hasMessageChannel } from '../core/env';
import {
  yieldWithSchedulerYield,
  yieldWithPostTask,
  yieldWithMessageChannel,
  yieldWithSetTimeout,
} from '../yielder/strategies';

export { Priority };

export class Scheduler {
  private queues: LinkedQueue[] = [
    new LinkedQueue(), // Priority.High   (0)
    new LinkedQueue(), // Priority.Normal (1)
    new LinkedQueue(), // Priority.Low    (2)
    new LinkedQueue(), // Priority.Idle   (3)
  ];

  private isRunning = false;
  private taskIdCounter = 0;
  private cancelledTaskIds = new Set<number>();
  private frameBudget = 5;

  addTask(callback: TaskCallback, priority: Priority = Priority.Normal): number {
    const id = ++this.taskIdCounter;

    const p = this.queues[priority] ? priority : Priority.Normal;

    this.queues[p].push(callback, p, id);

    if (!this.isRunning && isBrowser) {
      this.startWorkLoop();
    }

    return id;
  }

  cancelTask(id: number) {
    this.cancelledTaskIds.add(id);
  }

  private async startWorkLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    await Promise.resolve();

    while (this.hasPendingWork()) {
      const frameStart = performance.now();

      while (this.hasPendingWork()) {
        const elapsed = performance.now() - frameStart;

        if (elapsed >= this.frameBudget) break;

        const node = this.getNextTaskNode();

        if (node) {
          if (this.cancelledTaskIds.has(node.id)) {
            this.cancelledTaskIds.delete(node.id);
            continue;
          }

          try {
            const result = node.task();

            if (result instanceof Promise) {
              result.catch(err => console.error('Async Scheduler Task Failed:', err));
            }
          } catch (error) {
            console.error('Scheduler Task Failed:', error);
          }
        }
      }

      if (!this.hasPendingWork()) break;

      if (hasSchedulerYield) {
        await yieldWithSchedulerYield();
      } else if (hasSchedulerPostTask) {
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
    for (let i = 0; i < this.queues.length; i++) {
      if (!this.queues[i].isEmpty()) {
        return this.queues[i].shift();
      }
    }
    return null;
  }

  private hasPendingWork(): boolean {
    return this.queues.some(q => !q.isEmpty());
  }
}

export const globalScheduler = new Scheduler();
