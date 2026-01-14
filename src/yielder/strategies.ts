import { hasMessageChannel } from '../core/env';

export const yieldWithPostTask = (priority: 'user-blocking' | 'user-visible' | 'background') => {
  // @ts-ignore
  return scheduler.postTask(() => {}, { priority });
};

let channel: MessageChannel | null = null;
let portResolver: (() => void) | null = null;

if (hasMessageChannel) {
  channel = new MessageChannel();
  channel.port1.onmessage = () => {
    if (portResolver) {
      portResolver();
      portResolver = null;
    }
  };
}

export const yieldWithMessageChannel = () => {
  return new Promise<void>(resolve => {
    portResolver = resolve;
    channel?.port2.postMessage(null);
  });
};

export const yieldWithSetTimeout = () => {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
};
