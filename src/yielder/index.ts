import { isBrowser, hasScheduler, hasMessageChannel } from '../core/env';
import { yieldWithPostTask, yieldWithMessageChannel, yieldWithSetTimeout } from './strategies';

let GLOBAL_BUDGET = 5;
let lastYieldTime = 0;

export interface AfterYouOptions {
  force?: boolean;
  priority?: 'user-blocking' | 'user-visible' | 'background';
  budget?: number;
}

export async function afterYou(options: AfterYouOptions = {}) {
  if (!isBrowser) return;

  const now = performance.now();
  const budget = options?.budget ?? GLOBAL_BUDGET;

  if (!options?.force && now - lastYieldTime < budget) return;

  if (hasScheduler) await yieldWithPostTask(options.priority || 'user-visible');
  else if (hasMessageChannel) await yieldWithMessageChannel();
  else await yieldWithSetTimeout();

  lastYieldTime = performance.now();
}

export function setGlobalBudget(ms: number) {
  GLOBAL_BUDGET = ms;
}
