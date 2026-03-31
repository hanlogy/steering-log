import { readJsonRecord } from '@/helpers/readJsonRecord';
import { readFileSync } from 'fs';
import { isJsonRecord } from '@/helpers/checkTypes';

jest.mock('fs');
jest.mock('@/helpers/checkTypes');

const mockReadFileSync = jest.mocked(readFileSync);
const mockIsJsonRecord = jest.mocked(isJsonRecord);

const RECORD = { key: 'value' };

describe('readJsonRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadFileSync.mockReturnValue(JSON.stringify(RECORD));
    mockIsJsonRecord.mockReturnValue(true);
  });

  test('passes path to readFileSync', () => {
    readJsonRecord('/specific/path');

    expect(mockReadFileSync).toHaveBeenCalledWith('/specific/path', 'utf-8');
  });

  test('returns record when isJsonRecord returns true', () => {
    expect(readJsonRecord('/path')).toStrictEqual(RECORD);
  });

  test('returns null when isJsonRecord returns false', () => {
    mockIsJsonRecord.mockReturnValue(false);

    expect(readJsonRecord('/path')).toBeNull();
  });

  test('returns null when file content is invalid JSON', () => {
    mockReadFileSync.mockReturnValue('not json');

    expect(readJsonRecord('/path')).toBeNull();
  });

  test('returns null when readFileSync throws', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(readJsonRecord('/path')).toBeNull();
  });
});
