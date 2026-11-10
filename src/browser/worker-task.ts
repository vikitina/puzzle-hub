export class WorkerTaskError extends Error {
  readonly code: 'cancelled' | 'timeout' | 'failed';
  constructor(code: 'cancelled' | 'timeout' | 'failed') {
    super(code);
    this.name = 'WorkerTaskError';
    this.code = code;
  }
}
export interface BrowserWorkerPort<Request, Response> {
  onmessage: ((event: MessageEvent<Response>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage: (request: Request) => void;
  terminate: () => void;
}
export interface BrowserWorkerTask<Result> {
  promise: Promise<Result>;
  cancel: () => void;
}
export function createBrowserWorkerTask<Request, Response, Result>(
  request: Request,
  factory: () => BrowserWorkerPort<Request, Response>,
  decode: (response: Response) => Result,
  timeoutMs = 20_000,
): BrowserWorkerTask<Result> {
  let cancel = () => {};
  const promise = new Promise<Result>((resolve, reject) => {
    let worker: BrowserWorkerPort<Request, Response> | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
      complete();
    };
    const fail = (code: 'cancelled' | 'timeout' | 'failed') =>
      finish(() => reject(new WorkerTaskError(code)));
    cancel = () => fail('cancelled');
    try {
      worker = factory();
      worker.onmessage = ({ data }) => {
        if (settled) return;
        try {
          const result = decode(data);
          finish(() => resolve(result));
        } catch (error) {
          finish(() => reject(error));
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fail('failed');
      };
      worker.onmessageerror = () => fail('failed');
      timer = setTimeout(() => fail('timeout'), timeoutMs);
      worker.postMessage(request);
    } catch {
      fail('failed');
    }
  });
  return { promise, cancel: () => cancel() };
}