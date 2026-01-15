import { describe, it, expect } from 'vitest';
import { LinkedQueue } from '../src/scheduler/queue';
import { Priority } from '../src/scheduler/types';

describe('LinkedQueue Data Structure', () => {
  it('should be empty initially', () => {
    const queue = new LinkedQueue();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeNull();
  });

  it('should add items and retrieve them in FIFO order', () => {
    const queue = new LinkedQueue();
    const task1 = () => {};
    const task2 = () => {};

    queue.push(task1, Priority.Normal, 1);
    queue.push(task2, Priority.Normal, 2);

    expect(queue.isEmpty()).toBe(false);

    expect(queue.peek()?.id).toBe(1);
    expect(queue.peek()?.id).toBe(1);

    const node1 = queue.shift();
    expect(node1?.id).toBe(1);

    const node2 = queue.shift();
    expect(node2?.id).toBe(2);

    expect(queue.isEmpty()).toBe(true);
  });

  it('should handle pointers correctly when emptying and refilling the list', () => {
    const queue = new LinkedQueue();

    queue.push(() => {}, Priority.Normal, 1);
    queue.shift();

    expect(queue.isEmpty()).toBe(true);

    queue.push(() => {}, Priority.Normal, 2);

    const node = queue.shift();
    expect(node?.id).toBe(2);
    expect(queue.isEmpty()).toBe(true);
  });
});
