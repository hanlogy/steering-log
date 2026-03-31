import { handleHookEvent } from '@/scripts/appendToBuffer';
import { readStdin } from '@/helpers/readStdin';
import { buildPaths } from '@/helpers/buildPaths';
import { appendFileSync, mkdirSync } from 'fs';
import type { HookEventName } from '@/types';

jest.mock('@/helpers/readStdin', () => ({
  readStdin: jest.fn().mockReturnValue({
    sessionId: 'sess-1',
    cwd: '/project',
    hookEventName: 'SessionStart',
    data: {},
  }),
}));
jest.mock('@/helpers/buildPaths');
jest.mock('@/helpers/spawnScripts');
jest.mock('fs');

const mockReadStdin = jest.mocked(readStdin);
const mockBuildPaths = jest.mocked(buildPaths);
const mockAppendFileSync = jest.mocked(appendFileSync);
const mockMkdirSync = jest.mocked(mkdirSync);

const PATHS = {
  bufferPath: '/buf',
  conversationDir: '/conv',
  steeringLogDir: '/log',
  detectorContextPath: '/det',
  summarizerContextPath: '/sum',
  triggersQueuePath: '/trg',
};

const TIMESTAMP = '2026-03-30T00:00:00.000Z';

function makeStdin(overrides = {}) {
  const hookEventName: HookEventName = 'PostCompact';

  return {
    sessionId: 'sess-1',
    cwd: '/project',
    hookEventName,
    data: {},
    ...overrides,
  };
}

function parseAppendCall(): unknown {
  const [, raw] = mockAppendFileSync.mock.calls[0]!;
  return JSON.parse(String(raw).trimEnd());
}

describe('handleHookEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadStdin.mockReturnValue(makeStdin());
    mockBuildPaths.mockReturnValue(PATHS);
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(TIMESTAMP);
  });

  test('returns null when readStdin returns null', () => {
    mockReadStdin.mockReturnValue(null);

    expect(handleHookEvent()).toBeNull();
  });

  test('returns cwd and hookEventName on success', () => {
    mockReadStdin.mockReturnValue(makeStdin({ hookEventName: 'SessionStart' }));

    expect(handleHookEvent()).toStrictEqual({
      cwd: '/project',
      hookEventName: 'SessionStart',
    });
  });

  test('creates conversation dir before first append', () => {
    handleHookEvent();

    expect(mockMkdirSync).toHaveBeenCalledWith(PATHS.conversationDir, {
      recursive: true,
    });
  });

  test('appended entry ends with newline', () => {
    handleHookEvent();

    const [, raw] = mockAppendFileSync.mock.calls[0]!;

    expect(String(raw)).toMatch(/\n$/);
  });

  describe('PostCompact', () => {
    test('appends compact command with sessionId and timestamp', () => {
      handleHookEvent();

      expect(parseAppendCall()).toStrictEqual({
        command: 'compact',
        sessionId: 'sess-1',
        timestamp: TIMESTAMP,
      });
    });
  });

  describe('SessionEnd', () => {
    test('appends clear command when reason is "clear"', () => {
      mockReadStdin.mockReturnValue(
        makeStdin({ hookEventName: 'SessionEnd', data: { reason: 'clear' } }),
      );

      handleHookEvent();

      expect(parseAppendCall()).toStrictEqual({
        command: 'clear',
        sessionId: 'sess-1',
        timestamp: TIMESTAMP,
      });
    });

    test('does not append when reason is not "clear"', () => {
      mockReadStdin.mockReturnValue(
        makeStdin({ hookEventName: 'SessionEnd', data: { reason: 'other' } }),
      );

      handleHookEvent();

      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('Stop', () => {
    test('appends assistant message when last_assistant_message is a string', () => {
      mockReadStdin.mockReturnValue(
        makeStdin({
          hookEventName: 'Stop',
          data: { last_assistant_message: 'hello' },
        }),
      );

      handleHookEvent();

      expect(parseAppendCall()).toStrictEqual({
        role: 'assistant',
        content: 'hello',
        sessionId: 'sess-1',
        timestamp: TIMESTAMP,
      });
    });

    test('does not append when last_assistant_message is not a string', () => {
      mockReadStdin.mockReturnValue(
        makeStdin({ hookEventName: 'Stop', data: {} }),
      );

      handleHookEvent();

      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('UserPromptSubmit', () => {
    test('appends human message when prompt is a string', () => {
      mockReadStdin.mockReturnValue(
        makeStdin({
          hookEventName: 'UserPromptSubmit',
          data: { prompt: 'hi' },
        }),
      );

      handleHookEvent();

      expect(parseAppendCall()).toStrictEqual({
        role: 'human',
        content: 'hi',
        sessionId: 'sess-1',
        timestamp: TIMESTAMP,
      });
    });

    test('does not append when prompt is not a string', () => {
      mockReadStdin.mockReturnValue(
        makeStdin({ hookEventName: 'UserPromptSubmit', data: {} }),
      );

      handleHookEvent();

      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });
});
