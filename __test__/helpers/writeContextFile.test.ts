import { writeContextFile } from '@/helpers/writeContextFile';
import { writeFileSync } from 'fs';

jest.mock('fs');

const mockWriteFileSync = jest.mocked(writeFileSync);

describe('writeContextFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes path to writeFileSync', () => {
    writeContextFile('/specific/path', {});

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/specific/path',
      expect.any(String),
    );
  });

  test('writes data as prettified JSON', () => {
    const data = { isFinished: false, messages: [] };
    writeContextFile('/path', data);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/path',
      JSON.stringify(data, null, 2),
    );
  });
});
