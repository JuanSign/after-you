import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Scheduler, Priority } from '../src/scheduler';

vi.mock('../src/core/env', () => ({
  isBrowser: true,
  hasScheduler: false,
  hasMessageChannel: false,
}));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Scheduler Integration', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    vi.resetModules();
    scheduler = new Scheduler();

    vi.stubGlobal('performance', { now: () => Date.now() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should execute High priority tasks before Low priority ones', async () => {
    const executionOrder: string[] = [];

    scheduler.addTask(async () => {
      await sleep(10);
      executionOrder.push('LOW');
    }, Priority.Low);

    scheduler.addTask(async () => {
      await sleep(10);
      executionOrder.push('HIGH');
    }, Priority.High);

    await sleep(50);

    expect(executionOrder).toEqual(['HIGH', 'LOW']);
  });

  it('should run tasks strictly in order within the same priority', async () => {
    const executionOrder: number[] = [];

    scheduler.addTask(() => {
      executionOrder.push(1);
    }, Priority.Normal);
    scheduler.addTask(() => {
      executionOrder.push(2);
    }, Priority.Normal);
    scheduler.addTask(() => {
      executionOrder.push(3);
    }, Priority.Normal);

    await sleep(50);

    expect(executionOrder).toEqual([1, 2, 3]);
  });
});
