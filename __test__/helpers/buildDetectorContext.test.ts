import { buildDetectorContext } from '@/helpers/buildDetectorContext';
import { buildMessageEntries } from '@/helpers/buildMessageEntries';
import { isJsonArray } from '@/helpers/checkTypes';
import type { JsonRecord, MessageEntry } from '@/types';

jest.mock('@/helpers/buildMessageEntries');
jest.mock('@/helpers/checkTypes');

const mockBuildMessageEntries = jest.mocked(buildMessageEntries);
const mockIsJsonArray = jest.mocked(isJsonArray);

const MESSAGES: MessageEntry[] = [
  { sessionId: 's', timestamp: 't1', role: 'assistant', content: 'reply' },
  { sessionId: 's', timestamp: 't2', role: 'human', content: 'hi' },
];

function makeInput(overrides: Partial<JsonRecord> = {}): JsonRecord {
  return { isFinished: false, messages: [], ...overrides };
}

describe('buildDetectorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsJsonArray.mockReturnValue(true);
    mockBuildMessageEntries.mockReturnValue(MESSAGES);
  });

  test('returns null when isJsonArray returns false', () => {
    mockIsJsonArray.mockReturnValue(false);

    expect(buildDetectorContext(makeInput())).toBeNull();
  });

  test('returns null when isFinished is not a boolean', () => {
    expect(buildDetectorContext(makeInput({ isFinished: 'no' }))).toBeNull();
  });

  test('returns null when buildMessageEntries returns empty array', () => {
    mockBuildMessageEntries.mockReturnValue([]);

    expect(buildDetectorContext(makeInput())).toBeNull();
  });

  test('passes messages to buildMessageEntries', () => {
    const raw = [
      { role: 'human', content: 'hi', sessionId: 's', timestamp: 't' },
    ];
    buildDetectorContext(makeInput({ messages: raw }));

    expect(mockBuildMessageEntries).toHaveBeenCalledWith(raw);
  });

  test('returns context with messages and isFinished', () => {
    expect(buildDetectorContext(makeInput())).toStrictEqual({
      isFinished: false,
      messages: MESSAGES,
    });
  });

  test('reflects isFinished value', () => {
    expect(buildDetectorContext(makeInput({ isFinished: true }))).toStrictEqual(
      { isFinished: true, messages: MESSAGES },
    );
  });
});
