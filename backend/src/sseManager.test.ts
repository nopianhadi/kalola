import { SSEManager } from './sseManager';

describe('SSEManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('broadcasts only to matching user sessions', () => {
    const manager = new SSEManager();

    const writes: string[] = [];
    const makeRes = () => ({
      writableEnded: false,
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn((chunk: string) => {
        writes.push(chunk);
      }),
      on: jest.fn(),
    });

    const resA = makeRes();
    const resB = makeRes();

    manager.addClient('a', resA as any, 10);
    manager.addClient('b', resB as any, 20);

    resA.write.mockClear();
    resB.write.mockClear();

    manager.broadcast('projects', 'updated', { id: 1 }, 10);

    expect(resA.write).toHaveBeenCalledTimes(1);
    expect(resB.write).not.toHaveBeenCalled();
  });

  it('cleans up dead clients safely', () => {
    const manager = new SSEManager();

    const res = {
      writableEnded: true,
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      on: jest.fn(),
    };

    manager.addClient('dead', res as any, 1);
    manager.broadcast('projects', 'updated', { id: 1 }, 1);

    expect(manager.clientCount).toBe(0);
  });
});
