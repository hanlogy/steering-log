import { readTimestampQueue } from '@/helpers/readTimestampQueue';
import { existsSync, readFileSync } from 'fs';

jest.mock('fs');

const mockExistsSync = jest.mocked(existsSync);
const mockReadFileSync = jest.mocked(readFileSync);

describe('readTimestampQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  test('returns empty array when file does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    expect(readTimestampQueue('/path')).toStrictEqual([]);
  });

  test('does not read file when it does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    readTimestampQueue('/path');

    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  test('returns timestamps as array', () => {
    mockReadFileSync.mockReturnValue(
      '2026-03-28T20:12:01.902Z\n2026-03-28T21:17:11.177Z\n',
    );

    expect(readTimestampQueue('/path')).toStrictEqual([
      '2026-03-28T20:12:01.902Z',
      '2026-03-28T21:17:11.177Z',
    ]);
  });

  test('skips blank lines', () => {
    mockReadFileSync.mockReturnValue(
      '\n2026-03-28T20:12:01.902Z\n\n2026-03-28T21:17:11.177Z\n\n',
    );

    expect(readTimestampQueue('/path')).toStrictEqual([
      '2026-03-28T20:12:01.902Z',
      '2026-03-28T21:17:11.177Z',
    ]);
  });

  test('trims whitespace from each line', () => {
    mockReadFileSync.mockReturnValue('  2026-03-28T20:12:01.902Z  \n');

    expect(readTimestampQueue('/path')).toStrictEqual([
      '2026-03-28T20:12:01.902Z',
    ]);
  });

  test('passes path to existsSync and readFileSync', () => {
    mockReadFileSync.mockReturnValue('');
    readTimestampQueue('/specific/path');

    expect(mockExistsSync).toHaveBeenCalledWith('/specific/path');
    expect(mockReadFileSync).toHaveBeenCalledWith('/specific/path', 'utf-8');
  });
});
