import {
  isBrowser,
  hasSchedulerYield,
  hasSchedulerPostTask,
  hasMessageChannel,
  hasInputPending,
} from '../core/env';
import {
  yieldWithSchedulerYield,
  yieldWithPostTask,
  yieldWithMessageChannel,
  yieldWithSetTimeout,
} from './strategies';

let GLOBAL_BUDGET = 5;
let lastYieldTime = 0;

export interface AfterYouOptions {
  force?: boolean;
  priority?: 'user-blocking' | 'user-visible' | 'background';
  budget?: number;
  checkInputPending?: boolean;
}

export async function afterYou(options: AfterYouOptions = {}) {
  if (!isBrowser) return;

  const now = performance.now();
  const budget = options?.budget ?? GLOBAL_BUDGET;

  if (!options.force && now - lastYieldTime < budget) {
    return;
  }

  if (
    !options.force &&
    options.checkInputPending !== false &&
    hasInputPending &&
    // @ts-ignore
    !navigator.scheduling.isInputPending({ includeContinuous: true })
  ) {
    lastYieldTime = now;
    return;
  }

  if (hasSchedulerYield) {
    await yieldWithSchedulerYield();
  } else if (hasSchedulerPostTask) {
    await yieldWithPostTask(options.priority || 'user-visible');
  } else if (hasMessageChannel) {
    await yieldWithMessageChannel();
  } else {
    await yieldWithSetTimeout();
  }

  lastYieldTime = performance.now();
}

export function setGlobalBudget(ms: number) {
  GLOBAL_BUDGET = ms;
}
