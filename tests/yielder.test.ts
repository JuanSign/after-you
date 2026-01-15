import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('after-you', () => {
  async function loadModules() {
    vi.resetModules();
    return await import('../src/yielder/index');
  }

  let now = 0;

  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    // @ts-ignore
    globalThis.scheduler = { yield: vi.fn(), postTask: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-ignore
    delete globalThis.scheduler;
  });

  describe('Budget Logic', () => {
    it('should NOT yield if within budget', async () => {
      vi.doMock('../src/core/env', () => ({
        isBrowser: true,
        hasSchedulerYield: false,
        hasSchedulerPostTask: false,
        hasMessageChannel: false,
        hasInputPending: false,
      }));

      const { afterYou } = await loadModules();
      const strategies = await import('../src/yielder/strategies');
      const spyTimeout = vi.spyOn(strategies, 'yieldWithSetTimeout');

      await afterYou();
      now += 2;
      await afterYou();

      expect(spyTimeout).not.toHaveBeenCalled();
    });

    it('should yield if budget exceeded', async () => {
      vi.doMock('../src/core/env', () => ({
        isBrowser: true,
        hasSchedulerYield: false,
        hasSchedulerPostTask: false,
        hasMessageChannel: false,
        hasInputPending: false,
      }));

      const { afterYou } = await loadModules();
      const strategies = await import('../src/yielder/strategies');
      const spyTimeout = vi.spyOn(strategies, 'yieldWithSetTimeout');

      await afterYou();
      now += 10;
      await afterYou();

      expect(spyTimeout).toHaveBeenCalled();
    });

    it('should always yield if forced', async () => {
      vi.doMock('../src/core/env', () => ({
        isBrowser: true,
        hasSchedulerYield: false,
        hasSchedulerPostTask: false,
        hasMessageChannel: false,
        hasInputPending: false,
      }));

      const { afterYou } = await loadModules();
      const strategies = await import('../src/yielder/strategies');
      const spyTimeout = vi.spyOn(strategies, 'yieldWithSetTimeout');

      await afterYou({ force: true });

      expect(spyTimeout).toHaveBeenCalled();
    });
  });

  describe('Strategy Selection', () => {
    it('should use scheduler.yield if available', async () => {
      vi.doMock('../src/core/env', () => ({
        isBrowser: true,
        hasSchedulerYield: true,
        hasSchedulerPostTask: true,
        hasMessageChannel: true,
        hasInputPending: false,
      }));
      const { afterYou } = await loadModules();
      const strategies = await import('../src/yielder/strategies');

      const spyYield = vi.spyOn(strategies, 'yieldWithSchedulerYield');

      await afterYou({ force: true });

      expect(spyYield).toHaveBeenCalled();
    });

    it('should fallback to MessageChannel if scheduler is missing', async () => {
      vi.doMock('../src/core/env', () => ({
        isBrowser: true,
        hasSchedulerYield: false,
        hasSchedulerPostTask: false,
        hasMessageChannel: true,
        hasInputPending: false,
      }));

      const { afterYou } = await loadModules();
      const strategies = await import('../src/yielder/strategies');

      const spyChannel = vi.spyOn(strategies, 'yieldWithMessageChannel');
      const spyTimeout = vi.spyOn(strategies, 'yieldWithSetTimeout');

      await afterYou({ force: true });

      expect(spyChannel).toHaveBeenCalled();
      expect(spyTimeout).not.toHaveBeenCalled();
    });
  });

  describe('Integration: The Event Loop', () => {
    it('should allow other macrotasks to run when yielding', async () => {
      vi.doMock('../src/core/env', () => ({
        isBrowser: true,
        hasSchedulerYield: false,
        hasSchedulerPostTask: false,
        hasMessageChannel: false,
        hasInputPending: false,
      }));

      const { afterYou } = await loadModules();
      const executionOrder: string[] = [];

      setTimeout(() => {
        executionOrder.push('macrotask');
      }, 0);

      executionOrder.push('before');
      await afterYou({ force: true });
      executionOrder.push('after');

      expect(executionOrder).toEqual(['before', 'macrotask', 'after']);
    });
  });
});
