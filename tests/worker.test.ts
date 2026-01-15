import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runInWorker } from '../src/worker/index';

describe('runInWorker', () => {
  const originalWorker = globalThis.Worker;
  const originalURL = globalThis.URL;

  let mockPostMessage: any;
  let mockTerminate: any;
  let createdBlobContent: string = '';

  beforeEach(() => {
    mockPostMessage = vi.fn();
    mockTerminate = vi.fn();
    createdBlobContent = '';

    globalThis.URL = {
      ...originalURL,
      createObjectURL: vi.fn((blob: Blob) => {
        // @ts-ignore
        createdBlobContent = blob.parts?.[0] || '';
        return 'blob:mock-url';
      }),
      revokeObjectURL: vi.fn(),
    } as any;

    globalThis.Blob = class {
      parts: any[];
      constructor(parts: any[], options: any) {
        this.parts = parts;
      }
    } as any;

    globalThis.Worker = class {
      onmessage: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;

      postMessage(data: any) {
        mockPostMessage(data);

        if (this.onmessage) {
          setTimeout(() => {
            this.onmessage!({ data: { status: 'success', result: 'MOCKED_RESULT' } });
          }, 10);
        }
      }

      terminate() {
        mockTerminate();
      }
    } as any;
  });

  afterEach(() => {
    globalThis.Worker = originalWorker;
    globalThis.URL = originalURL;
  });

  it('should create a worker and resolve with result', async () => {
    const heavyFn = (a: number) => a * 2;

    const result = await runInWorker(heavyFn, [10]);

    expect(result).toBe('MOCKED_RESULT');
    expect(mockTerminate).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should include the function string in the blob', async () => {
    const uniqueFn = () => {
      return 'SECRET_CODE';
    };

    await runInWorker(uniqueFn, []);

    expect(createdBlobContent).toContain('SECRET_CODE');
  });

  it('should handle timeouts', async () => {
    globalThis.Worker = class {
      postMessage() {}
      terminate() {
        mockTerminate();
      }
    } as any;

    const promise = runInWorker(() => {}, [], { timeout: 10 });

    await expect(promise).rejects.toThrow('Worker timed out');
    expect(mockTerminate).toHaveBeenCalled();
  });
});
