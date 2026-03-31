import { existsSync, writeFileSync } from 'fs';
import { advanceSummarizer } from '@/helpers/advanceSummarizer';
import type { CommandEntry, MessageEntry } from '@/types';
import { readSummarizerContext } from '@/helpers/readSummarizerContext';
import { readBufferLog } from '@/helpers/readBufferLog';
import { readTimestampQueue } from '@/helpers/readTimestampQueue';

jest.mock('fs');
jest.mock('@/helpers/readSummarizerContext');
jest.mock('@/helpers/readBufferLog');
jest.mock('@/helpers/readTimestampQueue');

const mockExistsSync = jest.mocked(existsSync);
const mockWriteFileSync = jest.mocked(writeFileSync);
const mockReadSummarizerContext = jest.mocked(readSummarizerContext);
const mockReadBufferLog = jest.mocked(readBufferLog);
const mockReadTimestampQueue = jest.mocked(readTimestampQueue);

const CWD = '/project';

const humanMsg = (timestamp: string): MessageEntry => ({
  sessionId: 'session-1',
  role: 'human',
  timestamp,
  content: 'foo',
});

const assistantMsg = (timestamp: string): MessageEntry => ({
  sessionId: 'session-1',
  role: 'assistant',
  timestamp,
  content: 'baz',
});

const clearCmd = (timestamp: string): CommandEntry => ({
  sessionId: 'session-1',
  timestamp,
  command: 'clear',
});

const compactCmd = (timestamp: string): CommandEntry => ({
  sessionId: 'session-1',
  timestamp,
  command: 'compact',
});

// t0: human turn
// t1: assistant turn
// t2: human turn  (trigger at t2)
// t3: assistant turn
// t4: human turn  (trigger at t4)
// t5: assistant turn

const h0 = humanMsg('2026-01-01T09:00:00.000Z');
const a0 = assistantMsg('2026-01-01T09:10:00.000Z');
const h1 = humanMsg('2026-01-01T10:00:00.000Z');
const a1 = assistantMsg('2026-01-01T10:10:00.000Z');
const h2 = humanMsg('2026-01-01T11:00:00.000Z');
const a2 = assistantMsg('2026-01-01T11:10:00.000Z');

const trigger0 = h1.timestamp; // trigger fires after first assistant turn
const trigger1 = h2.timestamp; // trigger fires after second assistant turn

function parseJsonWriteCall(callIndex = 0): unknown {
  const [, raw] = mockWriteFileSync.mock.calls[callIndex]!;

  if (typeof raw !== 'string') {
    throw new Error('Expected writeFileSync to be called with a string');
  }

  return JSON.parse(raw);
}

describe('advanceSummarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  describe('returns null', () => {
    test('when buffer file does not exist', () => {
      mockExistsSync.mockReturnValueOnce(false);

      expect(advanceSummarizer(CWD)).toBe(null);
    });

    test('when context has isFinished: false and force is false', () => {
      mockReadSummarizerContext.mockReturnValue({
        isFinished: false,
        humanMessages: 1,
        assistantMessages: 1,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0],
      });

      expect(advanceSummarizer(CWD)).toBe(null);
    });

    test('when trigger queue is empty', () => {
      mockReadSummarizerContext.mockReturnValue(null);
      mockReadTimestampQueue.mockReturnValue([]);

      expect(advanceSummarizer(CWD)).toBe(null);
    });

    test('when all triggers are already processed', () => {
      mockReadSummarizerContext.mockReturnValue({
        isFinished: true,
        humanMessages: 1,
        assistantMessages: 1,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0, h1],
      });
      mockReadTimestampQueue.mockReturnValue([trigger0]);

      expect(advanceSummarizer(CWD)).toBe(null);
    });
  });

  describe('finalizes context when queue is drained', () => {
    test('sets isFinished: true on existing unfinished context when no new triggers', () => {
      const priorContext = {
        isFinished: false,
        humanMessages: 1,
        assistantMessages: 1,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0, h1],
      };

      mockReadSummarizerContext.mockReturnValue(priorContext);
      mockReadTimestampQueue.mockReturnValue([trigger0]);

      advanceSummarizer(CWD, { force: true });

      expect(parseJsonWriteCall()).toEqual({
        ...priorContext,
        isFinished: true,
      });
    });

    test('does not write when context is already finished and queue is drained', () => {
      mockReadSummarizerContext.mockReturnValue({
        isFinished: true,
        humanMessages: 1,
        assistantMessages: 1,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0, h1],
      });
      mockReadTimestampQueue.mockReturnValue([trigger0]);

      advanceSummarizer(CWD);

      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe('returns SummarizerContext and writes context', () => {
    test('on first run with no prior context', () => {
      mockReadSummarizerContext.mockReturnValue(null);
      mockReadTimestampQueue.mockReturnValue([trigger0]);
      mockReadBufferLog.mockReturnValue([h0, a0, h1, a1]);

      const result = advanceSummarizer(CWD);

      // trigger0 === h1.timestamp; a1 (10:10) is after trigger so excluded
      expect(result).toMatchObject({
        isFinished: false,
        humanMessages: 2,
        assistantMessages: 1,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0, h1],
      });

      const [path] = mockWriteFileSync.mock.calls[0]!;
      expect(String(path)).toContain('summarizer-context.json');
      expect(parseJsonWriteCall()).toMatchObject({ isFinished: false });
    });

    test('advances to next trigger after prior context', () => {
      mockReadSummarizerContext.mockReturnValue({
        isFinished: true,
        humanMessages: 2,
        assistantMessages: 2,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0, h1, a1],
      });
      mockReadTimestampQueue.mockReturnValue([trigger0, trigger1]);
      mockReadBufferLog.mockReturnValue([h0, a0, h1, a1, h2, a2]);

      const result = advanceSummarizer(CWD);

      // lastToTime = h1.timestamp (10:00); window covers entries after that up to trigger1 (11:00)
      // a1 (10:10) and h2 (11:00) are included; a2 (11:10) is after trigger
      expect(result).toMatchObject({
        humanMessages: 1,
        assistantMessages: 1,
        messages: [a1, h2],
      });
    });

    test('force: true overwrites when isFinished is false', () => {
      const priorContext = {
        isFinished: false,
        humanMessages: 1,
        assistantMessages: 1,
        clearCount: 0,
        compactCount: 0,
        messages: [h0, a0, h1],
      };

      mockReadSummarizerContext.mockReturnValue(priorContext);
      mockReadTimestampQueue.mockReturnValue([trigger0, trigger1]);
      mockReadBufferLog.mockReturnValue([h0, a0, h1, a1, h2, a2]);

      const result = advanceSummarizer(CWD, { force: true });

      // lastToTime = h1.timestamp (10:00); window covers entries after that up to trigger1 (11:00)
      // a1 (10:10) and h2 (11:00) are included; a2 (11:10) is after trigger
      expect(result).toMatchObject({
        isFinished: false,
        humanMessages: 1,
        assistantMessages: 1,
        messages: [a1, h2],
      });
    });

    test('counts clear and compact commands in the window', () => {
      mockReadSummarizerContext.mockReturnValue(null);
      mockReadTimestampQueue.mockReturnValue([trigger0]);

      const clear = clearCmd('2026-01-01T09:30:00.000Z');
      const compact = compactCmd('2026-01-01T09:45:00.000Z');

      mockReadBufferLog.mockReturnValue([h0, clear, compact, a0, h1]);

      const result = advanceSummarizer(CWD);

      expect(result).toMatchObject({
        clearCount: 1,
        compactCount: 1,
        messages: [h0, a0, h1],
      });
    });

    test('excludes entries after the trigger timestamp', () => {
      mockReadSummarizerContext.mockReturnValue(null);
      mockReadTimestampQueue.mockReturnValue([trigger0]);
      mockReadBufferLog.mockReturnValue([h0, a0, h1, a1, h2, a2]);

      const result = advanceSummarizer(CWD);

      // trigger0 === h1.timestamp, so h1 is included but a1, h2, a2 are not
      expect(result?.messages).toEqual([h0, a0, h1]);
    });
  });
});
