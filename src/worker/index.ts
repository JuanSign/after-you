import { isBrowser } from '../core/env';

export interface WorkerOptions {
  imports?: string[];
  timeout?: number;
}

export function runInWorker<T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  args: T,
  options: WorkerOptions = {}
): Promise<R> {
  if (!isBrowser) return Promise.reject(new Error('runInWorker is only supported in the browser.'));

  return new Promise((resolve, reject) => {
    const fnString = fn.toString();
    const imports = options.imports || [];

    const workerScript = `
      self.onmessage = async (e) => {
        const { args } = e.data;
        
        const libs = ${JSON.stringify(imports)};
        if (libs.length > 0) {
          try {
            importScripts(...libs);
          } catch (err) {
            self.postMessage({ status: 'error', error: 'Failed to import scripts: ' + err });
            return;
          }
        }

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

    let timeoutId: any;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    if (options.timeout) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Worker timed out after ${options.timeout}ms`));
      }, options.timeout);
    }

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
