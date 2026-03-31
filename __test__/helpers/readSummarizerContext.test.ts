import { readSummarizerContext } from '@/helpers/readSummarizerContext';
import { readJsonRecord } from '@/helpers/readJsonRecord';
import { buildSummarizerContext } from '@/helpers/buildSummarizerContext';
import { existsSync } from 'fs';
import type { SummarizerContext } from '@/types';

jest.mock('fs');
jest.mock('@/helpers/readJsonRecord');
jest.mock('@/helpers/buildSummarizerContext');

const mockExistsSync = jest.mocked(existsSync);
const mockReadJsonRecord = jest.mocked(readJsonRecord);
const mockBuildSummarizerContext = jest.mocked(buildSummarizerContext);

const CONTEXT: SummarizerContext = {
  isFinished: false,
  humanMessages: 1,
  assistantMessages: 1,
  clearCount: 0,
  compactCount: 0,
  messages: [{ sessionId: 's', timestamp: 't', role: 'human', content: 'hi' }],
};

const RECORD = { isFinished: false, messages: [] };

describe('readSummarizerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadJsonRecord.mockReturnValue(RECORD);
    mockBuildSummarizerContext.mockReturnValue(CONTEXT);
  });

  test('returns null when file does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    expect(readSummarizerContext('/path')).toBeNull();
  });

  test('does not read file when it does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    readSummarizerContext('/path');

    expect(mockReadJsonRecord).not.toHaveBeenCalled();
  });

  test('returns null when readJsonRecord returns null', () => {
    mockReadJsonRecord.mockReturnValue(null);

    expect(readSummarizerContext('/path')).toBeNull();
  });

  test('does not call buildSummarizerContext when readJsonRecord returns null', () => {
    mockReadJsonRecord.mockReturnValue(null);
    readSummarizerContext('/path');

    expect(mockBuildSummarizerContext).not.toHaveBeenCalled();
  });

  test('passes record to buildSummarizerContext', () => {
    readSummarizerContext('/path');

    expect(mockBuildSummarizerContext).toHaveBeenCalledWith(RECORD);
  });

  test('returns result of buildSummarizerContext', () => {
    expect(readSummarizerContext('/path')).toStrictEqual(CONTEXT);
  });

  test('returns null when buildSummarizerContext returns null', () => {
    mockBuildSummarizerContext.mockReturnValue(null);

    expect(readSummarizerContext('/path')).toBeNull();
  });

  test('passes path to existsSync and readJsonRecord', () => {
    readSummarizerContext('/specific/path');

    expect(mockExistsSync).toHaveBeenCalledWith('/specific/path');
    expect(mockReadJsonRecord).toHaveBeenCalledWith('/specific/path');
  });
});
