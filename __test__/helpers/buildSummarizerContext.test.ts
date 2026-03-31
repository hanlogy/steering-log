import { buildSummarizerContext } from '@/helpers/buildSummarizerContext';
import { buildMessageEntries } from '@/helpers/buildMessageEntries';
import { isJsonArray } from '@/helpers/checkTypes';
import type { JsonRecord, MessageEntry } from '@/types';

jest.mock('@/helpers/buildMessageEntries');
jest.mock('@/helpers/checkTypes');

const mockBuildMessageEntries = jest.mocked(buildMessageEntries);
const mockIsJsonArray = jest.mocked(isJsonArray);

const MESSAGES: MessageEntry[] = [
  { sessionId: 's', timestamp: 't', role: 'human', content: 'hi' },
];

function makeInput(overrides: Partial<JsonRecord> = {}): JsonRecord {
  return {
    isFinished: false,
    humanMessages: 1,
    assistantMessages: 2,
    clearCount: 0,
    compactCount: 0,
    messages: [],
    ...overrides,
  };
}

describe('buildSummarizerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsJsonArray.mockReturnValue(true);
    mockBuildMessageEntries.mockReturnValue(MESSAGES);
  });

  test.each([
    ['isFinished', 'not-a-boolean'],
    ['humanMessages', 'not-a-number'],
    ['assistantMessages', 'not-a-number'],
    ['clearCount', 'not-a-number'],
    ['compactCount', 'not-a-number'],
  ])('returns null when %s has wrong type', (field, value) => {
    expect(buildSummarizerContext(makeInput({ [field]: value }))).toBeNull();
  });

  test('returns null when isJsonArray returns false', () => {
    mockIsJsonArray.mockReturnValue(false);

    expect(buildSummarizerContext(makeInput())).toBeNull();
  });

  test('passes messages to buildMessageEntries', () => {
    const raw = [
      { role: 'human', content: 'hi', sessionId: 's', timestamp: 't' },
    ];
    buildSummarizerContext(makeInput({ messages: raw }));

    expect(mockBuildMessageEntries).toHaveBeenCalledWith(raw);
  });

  test('returns context with messages from buildMessageEntries', () => {
    expect(buildSummarizerContext(makeInput())).toStrictEqual({
      isFinished: false,
      humanMessages: 1,
      assistantMessages: 2,
      clearCount: 0,
      compactCount: 0,
      messages: MESSAGES,
    });
  });
});
