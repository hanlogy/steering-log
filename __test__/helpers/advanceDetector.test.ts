import { existsSync, writeFileSync } from 'fs';
import { advanceDetector } from '@/helpers/advanceDetector';
import type { CommandEntry, MessageEntry } from '@/types';
import { readDetectorContext } from '@/helpers/readDetectorContext';
import { readBufferLog } from '@/helpers/readBufferLog';

jest.mock('fs');
jest.mock('@/helpers/readDetectorContext');
jest.mock('@/helpers/readBufferLog');

const mockExistsSync = jest.mocked(existsSync);
const mockWriteFileSync = jest.mocked(writeFileSync);
const mockReadDetectorContextFile = jest.mocked(readDetectorContext);
const mockReadBufferFile = jest.mocked(readBufferLog);

const CWD = '/project';

const humanMsg = (data: Pick<MessageEntry, 'timestamp'>): MessageEntry => ({
  ...data,
  sessionId: 'session-1',
  role: 'human',
  content: 'foo',
});

const assistantMsg = (data: Pick<MessageEntry, 'timestamp'>): MessageEntry => ({
  ...data,
  sessionId: 'session-1',
  role: 'assistant',
  content: 'baz',
});

const humanMsg0 = humanMsg({ timestamp: '2026-01-01T08:50:00.000Z' });
const assistantMsg0 = assistantMsg({ timestamp: '2026-01-01T09:00:00.000Z' });
const humanMsg1 = humanMsg({ timestamp: '2026-01-01T09:50:00.000Z' });
const assistantMsg1 = assistantMsg({ timestamp: '2026-01-01T10:00:00.000Z' });
const humanMsg2 = humanMsg({ timestamp: '2026-01-01T10:50:00.000Z' });
const assistantMsg2 = assistantMsg({ timestamp: '2026-01-01T11:00:00.000Z' });
const humanMsg3 = humanMsg({ timestamp: '2026-01-01T11:50:00.000Z' });
const assistantMsg3 = assistantMsg({ timestamp: '2026-01-01T12:00:00.000Z' });

const clearCmd: CommandEntry = {
  sessionId: 'session-1',
  timestamp: '2026-01-01T09:30:00.000Z',
  command: 'clear',
};

function setupFirstRun() {
  mockReadDetectorContextFile.mockReturnValue(null);
  mockReadBufferFile.mockReturnValue([
    humanMsg0,
    assistantMsg0,
    humanMsg1,
    assistantMsg1,
    humanMsg2,
    assistantMsg2,
    humanMsg3,
    assistantMsg3,
  ]);
}

function parseJsonWriteCall(): unknown {
  const [, raw] = mockWriteFileSync.mock.calls[0]!;

  if (typeof raw !== 'string') {
    throw new Error('Expected writeFileSync to be called with a string');
  }

  return JSON.parse(raw);
}

describe('advanceDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  describe('returns null', () => {
    test('when buffer file does not exist', () => {
      mockExistsSync.mockReturnValueOnce(false);

      expect(advanceDetector(CWD)).toBe(null);
    });

    test('when buffer has no human messages', () => {
      mockReadDetectorContextFile.mockReturnValue(null);
      mockReadBufferFile.mockReturnValue([assistantMsg0]);

      expect(advanceDetector(CWD)).toBe(null);
    });

    test('when context has isFinished: false and force is false', () => {
      // humanMsg1 is in progress.
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: false,
        messages: [assistantMsg0, humanMsg1],
      });

      expect(advanceDetector(CWD)).toBe(null);
    });

    test('when queue is drained', () => {
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: true,
        messages: [assistantMsg1, humanMsg2],
      });

      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        humanMsg1,
        assistantMsg1,
        humanMsg2,
        assistantMsg2,
      ]);

      expect(advanceDetector(CWD)).toBe(null);
    });

    test('when caught up but isFinished: false (post script path)', () => {
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: false,
        messages: [assistantMsg1, humanMsg2],
      });

      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        humanMsg1,
        assistantMsg1,
        humanMsg2,
        assistantMsg2,
      ]);

      expect(advanceDetector(CWD, { force: true })).toBe(null);
    });

    test('when target human message is not found in buffer', () => {
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: true,
        messages: [assistantMsg0, humanMsg1],
      });

      mockReadBufferFile.mockReturnValue([humanMsg0, assistantMsg0]);

      expect(advanceDetector(CWD)).toBe(null);
    });

    test('when no assistant precedes any pending entry in the buffer', () => {
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: true,
        messages: [assistantMsg0, humanMsg1],
      });

      mockReadBufferFile.mockReturnValue([humanMsg0, humanMsg1, humanMsg2]);

      expect(advanceDetector(CWD)).toBe(null);
    });
  });

  describe('skips entries with no preceding assistant', () => {
    test('interrupted assistant', () => {
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: true,
        messages: [assistantMsg0, humanMsg1],
      });
      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        humanMsg1,
        humanMsg2, // no assistantMsg1 — assistant was interrupted
        assistantMsg2,
        humanMsg3,
      ]);
      advanceDetector(CWD);

      // TODO: It is a design issue, we should not proceed the interrupted
      // message. Update it when we have captured the `ESC` command.
      // assistantMsg0 is the nearest assistant before humanMsg2
      expect(parseJsonWriteCall()).toMatchObject({
        messages: [assistantMsg0, humanMsg2],
      });
    });
  });

  describe('returns true and writes context', () => {
    test('on first run with no prior context', () => {
      setupFirstRun();
      advanceDetector(CWD);

      const [path] = mockWriteFileSync.mock.calls[0]!;
      expect(String(path)).toContain('detector-context.json');

      expect(parseJsonWriteCall()).toEqual({
        isFinished: false,
        messages: [assistantMsg0, humanMsg1],
      });
    });

    test('finalizes context when queue is caught up', () => {
      const priorContext = {
        isFinished: false,
        messages: [assistantMsg1, humanMsg2],
      };

      // humanMsg2 is the last entry; context is still unfinished from a prior
      // force run
      mockReadDetectorContextFile.mockReturnValue(priorContext);
      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        humanMsg1,
        assistantMsg1,
        humanMsg2,
      ]);

      advanceDetector(CWD, { force: true });

      expect(parseJsonWriteCall()).toEqual({
        ...priorContext,
        isFinished: true,
      });
    });

    test('force: true overwrites when isFinished is false', () => {
      // humanMsg1 in progress (isFinished: false); humanMsg2 is next; humanMsg3
      // still pending
      const priorContext = {
        isFinished: false,
        messages: [assistantMsg0, humanMsg1],
      };

      mockReadDetectorContextFile.mockReturnValue(priorContext);
      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        humanMsg1,
        assistantMsg1,
        humanMsg2,
        assistantMsg2,
        humanMsg3,
        assistantMsg3,
      ]);

      const newContext = {
        ...priorContext,
        messages: [assistantMsg1, humanMsg2],
      };

      expect(advanceDetector(CWD, { force: true })).toStrictEqual(newContext);
      expect(parseJsonWriteCall()).toStrictEqual(newContext);
    });

    test('advances to next queue entry after prior context', () => {
      mockReadDetectorContextFile.mockReturnValue({
        isFinished: true,
        messages: [assistantMsg0, humanMsg1],
      });

      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        humanMsg1,
        assistantMsg1,
        humanMsg2,
        assistantMsg2,
        humanMsg3,
        assistantMsg3,
      ]);

      advanceDetector(CWD);

      expect(parseJsonWriteCall()).toMatchObject({
        messages: [assistantMsg1, humanMsg2],
      });
    });

    test('ignores command entries in buffer', () => {
      mockReadDetectorContextFile.mockReturnValue(null);
      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        assistantMsg0,
        clearCmd,
        humanMsg1,
      ]);

      advanceDetector(CWD);

      expect(parseJsonWriteCall()).toStrictEqual({
        isFinished: false,
        messages: [assistantMsg0, humanMsg1],
      });
    });

    test('picks the closest preceding assistant message', () => {
      setupFirstRun();
      const earlyAssistant = {
        ...assistantMsg0,
        timestamp: '2026-01-01T08:00:00.000Z',
        content: 'Earlier response',
      };

      mockReadBufferFile.mockReturnValue([
        humanMsg0,
        earlyAssistant,
        assistantMsg0,
        humanMsg1,
        assistantMsg1,
        humanMsg2,
        assistantMsg2,
        humanMsg3,
      ]);

      advanceDetector(CWD);

      expect(parseJsonWriteCall()).toMatchObject({
        messages: [assistantMsg0, humanMsg1],
      });
    });
  });
});
