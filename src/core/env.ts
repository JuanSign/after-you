export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// @ts-ignore
export const hasScheduler = isBrowser && typeof scheduler !== 'undefined' && !!scheduler.postTask;
export const hasMessageChannel = isBrowser && typeof MessageChannel !== 'undefined';
