import { hasMessageChannel } from '../core/env';

// Strategy 1
export const yieldWithSchedulerYield = async () => {
  // @ts-ignore
  await scheduler.yield();
};

// Strategy 2
export const yieldWithPostTask = (priority: 'user-blocking' | 'user-visible' | 'background') => {
  // @ts-ignore
  return scheduler.postTask(() => {}, { priority });
};

// Strategy 3
let channel: MessageChannel | null = null;
const resolvers: Array<() => void> = [];

if (hasMessageChannel) {
  channel = new MessageChannel();
  channel.port1.onmessage = () => {
    const resolve = resolvers.shift();
    resolve?.();
  };
}

export const yieldWithMessageChannel = () => {
  return new Promise<void>(resolve => {
    resolvers.push(resolve);
    channel?.port2.postMessage(null);
  });
};

// Strategy 4
export const yieldWithSetTimeout = () => {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
};
