import { isBrowser } from '../core/env';

export interface WorkerOptions {
  autoTerminate?: boolean;
}

export function runInWorker<T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  ...args: T
): Promise<R> {
  if (!isBrowser) return Promise.reject(new Error('runInWorker is only supported in the browser.'));

  return new Promise((resolve, reject) => {
    const fnString = fn.toString();

    const workerScript = `
      self.onmessage = async (e) => {
        const { args } = e.data;
        
        try {
          const taskFn = (${fnString});
          const result = await taskFn(...args);
          
          self.postMessage({ status: 'success', result });
        } catch (error) {
          self.postMessage({ status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    const worker = new Worker(workerUrl);

    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    worker.onmessage = e => {
      const { status, result, error } = e.data;

      cleanup();

      if (status === 'success') {
        resolve(result);
      } else {
        reject(new Error(`Worker Error: ${error}`));
      }
    };

    worker.onerror = e => {
      cleanup();
      reject(new Error(`Worker connection failed: ${e.message}`));
    };

    worker.postMessage({ args });
  });
}
