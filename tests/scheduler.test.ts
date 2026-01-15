import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Priority } from '../src/scheduler/types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Scheduler Integration', () => {
  async function loadScheduler() {
    vi.resetModules();
    vi.doMock('../src/core/env', () => ({
      isBrowser: true,
      hasSchedulerYield: false,
      hasSchedulerPostTask: false,
      hasMessageChannel: false,
    }));
    return await import('../src/scheduler/index');
  }

  let scheduler: any;

  beforeEach(async () => {
    vi.stubGlobal('performance', { now: () => Date.now() });
    const module = await loadScheduler();
    scheduler = module.globalScheduler;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should execute High priority tasks before Low priority ones', async () => {
    const executionOrder: string[] = [];

    scheduler.addTask(async () => {
      await sleep(5);
      executionOrder.push('LOW');
    }, Priority.Low);

    scheduler.addTask(async () => {
      await sleep(5);
      executionOrder.push('HIGH');
    }, Priority.High);

    await sleep(50);

    expect(executionOrder).toEqual(['HIGH', 'LOW']);
  });

  it('should run tasks strictly in FIFO order within the same priority', async () => {
    const executionOrder: number[] = [];

    scheduler.addTask(() => executionOrder.push(1), Priority.Normal);
    scheduler.addTask(() => executionOrder.push(2), Priority.Normal);
    scheduler.addTask(() => executionOrder.push(3), Priority.Normal);

    await sleep(20);

    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('should not execute cancelled tasks', async () => {
    const spy = vi.fn();

    const taskId = scheduler.addTask(spy, Priority.Normal);

    scheduler.cancelTask(taskId);

    await sleep(20);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should continue processing queue even if a task throws an error', async () => {
    const goodTask = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    scheduler.addTask(() => {
      throw new Error('Boom!');
    }, Priority.High);

    scheduler.addTask(goodTask, Priority.Normal);

    await sleep(20);

    expect(goodTask).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should yield to main thread if frame budget is exceeded', async () => {
    vi.resetModules();

    vi.doMock('../src/core/env', () => ({
      isBrowser: true,
      hasSchedulerYield: false,
      hasSchedulerPostTask: false,
      hasMessageChannel: false,
    }));

    const { globalScheduler } = await import('../src/scheduler/index');
    const strategies = await import('../src/yielder/strategies');

    const yieldSpy = vi.spyOn(strategies, 'yieldWithSetTimeout');

    let time = 0;
    vi.stubGlobal('performance', {
      now: () => {
        time += 2;
        return time;
      },
    });

    for (let i = 0; i < 10; i++) {
      globalScheduler.addTask(() => {});
    }

    await new Promise(r => setTimeout(r, 50));

    expect(yieldSpy).toHaveBeenCalled();
  });
});
