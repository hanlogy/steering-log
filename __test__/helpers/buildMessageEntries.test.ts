import { buildMessageEntries } from '@/helpers/buildMessageEntries';
import { buildMessageEntry } from '@/helpers/buildMessageEntry';
import { isJsonRecord } from '@/helpers/checkTypes';
import type { MessageEntry } from '@/types';

jest.mock('@/helpers/buildMessageEntry');
jest.mock('@/helpers/checkTypes');

const mockBuildMessageEntry = jest.mocked(buildMessageEntry);
const mockIsJsonRecord = jest.mocked(isJsonRecord);

const ENTRY: MessageEntry = {
  sessionId: 's',
  timestamp: 't',
  role: 'human',
  content: 'hi',
};

describe('buildMessageEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsJsonRecord.mockReturnValue(true);
    mockBuildMessageEntry.mockReturnValue(ENTRY);
  });

  test('returns empty array for empty input', () => {
    expect(buildMessageEntries([])).toStrictEqual([]);
  });

  test('skips items where isJsonRecord returns false without calling buildMessageEntry', () => {
    mockIsJsonRecord.mockReturnValue(false);

    expect(buildMessageEntries(['not a record'])).toStrictEqual([]);
    expect(mockBuildMessageEntry).not.toHaveBeenCalled();
  });

  test('skips items where buildMessageEntry returns null', () => {
    mockBuildMessageEntry.mockReturnValue(null);

    expect(buildMessageEntries([{}])).toStrictEqual([]);
  });

  test('passes record to buildMessageEntry', () => {
    const item = { role: 'human', content: 'hi' };
    buildMessageEntries([item]);

    expect(mockBuildMessageEntry).toHaveBeenCalledWith(item);
  });

  test('returns entries from buildMessageEntry', () => {
    expect(buildMessageEntries([{}])).toStrictEqual([ENTRY]);
  });

  test('filters mixed items preserving order', () => {
    const ENTRY_2: MessageEntry = { ...ENTRY, role: 'assistant' };
    mockIsJsonRecord.mockReturnValueOnce(false).mockReturnValue(true);
    mockBuildMessageEntry
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(ENTRY)
      .mockReturnValueOnce(ENTRY_2);

    expect(buildMessageEntries(['skip', {}, {}, {}])).toStrictEqual([
      ENTRY,
      ENTRY_2,
    ]);
  });
});
