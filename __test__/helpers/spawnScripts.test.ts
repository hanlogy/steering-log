import {
  spawnDetectorScript,
  spawnSummarizerScript,
} from '@/helpers/spawnScripts';
import { spawn } from 'child_process';

jest.mock('child_process');

const mockSpawn = jest.mocked(spawn);
const mockUnref = jest.fn();

describe('spawnDetectorScript / spawnSummarizerScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env['CLAUDE_PLUGIN_ROOT'] = '/plugin';
    mockSpawn.mockReturnValue({ unref: mockUnref } as never);
  });

  afterEach(() => {
    delete process.env['CLAUDE_PLUGIN_ROOT'];
  });

  test('does nothing when CLAUDE_PLUGIN_ROOT is not set', () => {
    delete process.env['CLAUDE_PLUGIN_ROOT'];
    spawnDetectorScript('/project');

    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test('spawnDetectorScript spawns runDetector.js', () => {
    spawnDetectorScript('/project');

    expect(mockSpawn).toHaveBeenCalledWith(
      process.execPath,
      ['/plugin/scripts/runDetector.js', '/project'],
      { detached: true, stdio: 'ignore' },
    );
  });

  test('spawnSummarizerScript spawns runSummarizer.js', () => {
    spawnSummarizerScript('/project');

    expect(mockSpawn).toHaveBeenCalledWith(
      process.execPath,
      ['/plugin/scripts/runSummarizer.js', '/project'],
      { detached: true, stdio: 'ignore' },
    );
  });

  test('calls unref on the child process', () => {
    spawnDetectorScript('/project');

    expect(mockUnref).toHaveBeenCalled();
  });
});
