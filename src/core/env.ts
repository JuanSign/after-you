export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// @ts-ignore
const sch = isBrowser && globalThis.scheduler;

export const hasSchedulerYield = !!(sch && sch.yield);
export const hasSchedulerPostTask = !!(sch && sch.postTask);

export const hasMessageChannel = isBrowser && typeof MessageChannel !== 'undefined';

// @ts-ignore
export const hasInputPending =
  isBrowser && navigator.scheduling && !!navigator.scheduling.isInputPending;
