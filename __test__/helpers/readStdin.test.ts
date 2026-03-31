import { readFileSync } from 'fs';
import { readStdin } from '@/helpers/readStdin';
import { isJsonRecord, isOneOf } from '@/helpers/checkTypes';

jest.mock('fs');
jest.mock('@/helpers/checkTypes');

const mockReadFileSync = jest.mocked(readFileSync);
const mockIsJsonRecord = jest.mocked(isJsonRecord);
const mockIsOneOf = jest.mocked(isOneOf);

const VALID_INPUT = {
  session_id: 'sess-123',
  cwd: '/project',
  hook_event_name: 'UserPromptSubmit',
  prompt: 'hello',
};

function mockStdin(data: unknown): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(data) as never);
}

describe('readStdin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsJsonRecord.mockReturnValue(true);
    mockIsOneOf.mockReturnValue(true);
    mockStdin(VALID_INPUT);
  });

  describe('returns null', () => {
    test('when isJsonRecord returns false', () => {
      mockIsJsonRecord.mockReturnValue(false);

      expect(readStdin()).toBeNull();
    });

    test('when session_id is missing', () => {
      mockStdin({ cwd: '/project', hook_event_name: 'UserPromptSubmit' });

      expect(readStdin()).toBeNull();
    });

    test('when cwd is missing', () => {
      mockStdin({
        session_id: 'sess-123',
        hook_event_name: 'UserPromptSubmit',
      });

      expect(readStdin()).toBeNull();
    });

    test('when hook_event_name is missing', () => {
      mockStdin({ session_id: 'sess-123', cwd: '/project' });

      expect(readStdin()).toBeNull();
    });

    test('when session_id is not a string', () => {
      mockStdin({ ...VALID_INPUT, session_id: 42 });

      expect(readStdin()).toBeNull();
    });

    test('when cwd is not a string', () => {
      mockStdin({ ...VALID_INPUT, cwd: null });

      expect(readStdin()).toBeNull();
    });

    test('when hook_event_name is not a string', () => {
      mockStdin({ ...VALID_INPUT, hook_event_name: 42 });

      expect(readStdin()).toBeNull();
    });

    test('when isOneOf returns false', () => {
      mockIsOneOf.mockReturnValue(false);

      expect(readStdin()).toBeNull();
    });
  });

  test('returns parsed payload with data excluding reserved fields', () => {
    expect(readStdin()).toStrictEqual({
      sessionId: 'sess-123',
      cwd: '/project',
      hookEventName: 'UserPromptSubmit',
      data: { prompt: 'hello' },
    });
  });
});
