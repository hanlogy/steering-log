import { readBufferLog } from '@/helpers/readBufferLog';
import { readFileSync } from 'fs';
import { buildMessageEntry } from '@/helpers/buildMessageEntry';
import { buildCommandEntry } from '@/helpers/buildCommandEntry';
import type { CommandEntry, MessageEntry } from '@/types';

jest.mock('fs');
jest.mock('@/helpers/buildMessageEntry');
jest.mock('@/helpers/buildCommandEntry');

const mockReadFileSync = jest.mocked(readFileSync);
const mockBuildMessageEntry = jest.mocked(buildMessageEntry);
const mockBuildCommandEntry = jest.mocked(buildCommandEntry);

const MESSAGE: MessageEntry = {
  sessionId: 's',
  timestamp: 't',
  role: 'human',
  content: 'hi',
};

const COMMAND: CommandEntry = {
  sessionId: 's',
  timestamp: 't',
  command: 'clear',
};

describe('readBufferLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildMessageEntry.mockReturnValue(null);
    mockBuildCommandEntry.mockReturnValue(null);
  });

  test('passes the path to readFileSync', () => {
    mockReadFileSync.mockReturnValue('');
    readBufferLog('/specific/path/buffer.jsonl');

    expect(mockReadFileSync).toHaveBeenCalledWith(
      '/specific/path/buffer.jsonl',
      'utf-8',
    );
  });

  test('returns empty array for empty file', () => {
    mockReadFileSync.mockReturnValue('');

    expect(readBufferLog('/path')).toEqual([]);
  });

  test('skips blank lines', () => {
    mockReadFileSync.mockReturnValue('\n   \n\n');

    expect(readBufferLog('/path')).toEqual([]);
    expect(mockBuildMessageEntry).not.toHaveBeenCalled();
    expect(mockBuildCommandEntry).not.toHaveBeenCalled();
  });

  test('skips lines with invalid JSON', () => {
    mockReadFileSync.mockReturnValue('not json\n{ broken\n');

    expect(readBufferLog('/path')).toEqual([]);
    expect(mockBuildMessageEntry).not.toHaveBeenCalled();
    expect(mockBuildCommandEntry).not.toHaveBeenCalled();
  });

  test('skips non-object JSON values', () => {
    mockReadFileSync.mockReturnValue('"string"\n42\ntrue\nnull\n');

    expect(readBufferLog('/path')).toEqual([]);
    expect(mockBuildMessageEntry).not.toHaveBeenCalled();
    expect(mockBuildCommandEntry).not.toHaveBeenCalled();
  });

  test('passes parsed record to buildMessageEntry and buildCommandEntry', () => {
    const record = { foo: 'bar' };
    mockReadFileSync.mockReturnValue(JSON.stringify(record) + '\n');

    expect(readBufferLog('/path')).toEqual([]);
    expect(mockBuildMessageEntry).toHaveBeenCalledWith(record);
    expect(mockBuildCommandEntry).toHaveBeenCalledWith(record);
  });

  test('includes entry returned by buildMessageEntry', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ foo: 'bar' }) + '\n');
    mockBuildMessageEntry.mockReturnValue(MESSAGE);

    expect(readBufferLog('/path')).toEqual([MESSAGE]);
  });

  test('does not call buildCommandEntry when buildMessageEntry returns a value', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ foo: 'bar' }) + '\n');
    mockBuildMessageEntry.mockReturnValue(MESSAGE);

    readBufferLog('/path');

    expect(mockBuildCommandEntry).not.toHaveBeenCalled();
  });

  test('includes entry returned by buildCommandEntry when buildMessageEntry returns null', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ foo: 'bar' }) + '\n');
    mockBuildCommandEntry.mockReturnValue(COMMAND);

    expect(readBufferLog('/path')).toEqual([COMMAND]);
  });

  test('skips line when both builders return null', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ foo: 'bar' }) + '\n');

    expect(readBufferLog('/path')).toEqual([]);
  });

  test('collects multiple entries in order', () => {
    const line1 = JSON.stringify({ a: 1 });
    const line2 = JSON.stringify({ b: 2 });

    mockReadFileSync.mockReturnValue(`${line1}\n${line2}\n`);
    mockBuildMessageEntry
      .mockReturnValueOnce(MESSAGE)
      .mockReturnValueOnce(null);
    mockBuildCommandEntry.mockReturnValueOnce(COMMAND);

    expect(readBufferLog('/path')).toEqual([MESSAGE, COMMAND]);
  });

  test('skips invalid lines mixed with valid ones', () => {
    const valid = JSON.stringify({ x: 1 });

    mockReadFileSync.mockReturnValue(`bad json\n${valid}\n`);
    mockBuildMessageEntry.mockReturnValue(MESSAGE);

    expect(readBufferLog('/path')).toEqual([MESSAGE]);
    expect(mockBuildMessageEntry).toHaveBeenCalledTimes(1);
  });
});
