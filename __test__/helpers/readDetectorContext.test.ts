import { readDetectorContext } from '@/helpers/readDetectorContext';
import { readJsonRecord } from '@/helpers/readJsonRecord';
import { buildDetectorContext } from '@/helpers/buildDetectorContext';
import { existsSync } from 'fs';
import type { DetectorContext } from '@/types';

jest.mock('fs');
jest.mock('@/helpers/readJsonRecord');
jest.mock('@/helpers/buildDetectorContext');

const mockExistsSync = jest.mocked(existsSync);
const mockReadJsonRecord = jest.mocked(readJsonRecord);
const mockBuildDetectorContext = jest.mocked(buildDetectorContext);

const CONTEXT: DetectorContext = {
  isFinished: false,
  messages: [
    { sessionId: 's', timestamp: 't', role: 'assistant', content: 'reply' },
    { sessionId: 's', timestamp: 't', role: 'human', content: 'hi' },
  ],
};

const RECORD = { isFinished: false, messages: [] };

describe('readDetectorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadJsonRecord.mockReturnValue(RECORD);
    mockBuildDetectorContext.mockReturnValue(CONTEXT);
  });

  test('returns null when file does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    expect(readDetectorContext('/path')).toBeNull();
  });

  test('does not read file when it does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    readDetectorContext('/path');

    expect(mockReadJsonRecord).not.toHaveBeenCalled();
  });

  test('returns null when readJsonRecord returns null', () => {
    mockReadJsonRecord.mockReturnValue(null);

    expect(readDetectorContext('/path')).toBeNull();
  });

  test('does not call buildDetectorContext when readJsonRecord returns null', () => {
    mockReadJsonRecord.mockReturnValue(null);
    readDetectorContext('/path');

    expect(mockBuildDetectorContext).not.toHaveBeenCalled();
  });

  test('passes record to buildDetectorContext', () => {
    readDetectorContext('/path');

    expect(mockBuildDetectorContext).toHaveBeenCalledWith(RECORD);
  });

  test('returns result of buildDetectorContext', () => {
    expect(readDetectorContext('/path')).toStrictEqual(CONTEXT);
  });

  test('returns null when buildDetectorContext returns null', () => {
    mockBuildDetectorContext.mockReturnValue(null);

    expect(readDetectorContext('/path')).toBeNull();
  });

  test('passes path to existsSync and readJsonRecord', () => {
    readDetectorContext('/specific/path');

    expect(mockExistsSync).toHaveBeenCalledWith('/specific/path');
    expect(mockReadJsonRecord).toHaveBeenCalledWith('/specific/path');
  });
});
