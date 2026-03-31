import { writeTriggersQueue } from '@/helpers/writeTriggersQueue';
import { buildPaths } from '@/helpers/buildPaths';
import { appendFileSync } from 'fs';

jest.mock('fs');
jest.mock('@/helpers/buildPaths');

const mockAppendFileSync = jest.mocked(appendFileSync);
const mockBuildPaths = jest.mocked(buildPaths);

describe('writeTriggersQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildPaths.mockReturnValue({
      triggersQueuePath: '/trg',
      steeringLogDir: '/log',
      conversationDir: '/conv',
      detectorContextPath: '/det',
      summarizerContextPath: '/sum',
      bufferPath: '/buf',
    });
  });

  test('passes cwd to buildPaths', () => {
    writeTriggersQueue('/project', { timestamp: 't' });

    expect(mockBuildPaths).toHaveBeenCalledWith('/project');
  });

  test('appends timestamp followed by newline', () => {
    writeTriggersQueue('/project', { timestamp: '2026-03-28T20:12:01.902Z' });

    expect(mockAppendFileSync).toHaveBeenCalledWith(
      '/trg',
      '2026-03-28T20:12:01.902Z\n',
    );
  });
});
