import type { runDetector as RunDetectorFn } from '@/scripts/runDetector';
import { advanceDetector } from '@/helpers/advanceDetector';
import { parseDetectorAgentOutput } from '@/helpers/parseDetectorAgentOutput';
import { spawnDetectorAgent } from '@/helpers/spawnAgents';
import { writeTriggersQueue } from '@/helpers/writeTriggersQueue';
import { spawnSummarizerScript } from '@/helpers/spawnScripts';
import type { DetectorContext } from '@/types';

jest.mock('@/helpers/advanceDetector');
jest.mock('@/helpers/parseDetectorAgentOutput');
jest.mock('@/helpers/spawnAgents');
jest.mock('@/helpers/writeTriggersQueue');
jest.mock('@/helpers/spawnScripts');

const mockAdvanceDetector = jest.mocked(advanceDetector);
const mockParseDetectorAgentOutput = jest.mocked(parseDetectorAgentOutput);
const mockSpawnDetectorAgent = jest.mocked(spawnDetectorAgent);
const mockWriteTriggersQueue = jest.mocked(writeTriggersQueue);
const mockSpawnSummarizerScript = jest.mocked(spawnSummarizerScript);

const CWD = '/cwd';

const CONTEXT: DetectorContext = {
  isFinished: false,
  messages: [
    {
      role: 'assistant',
      content: 'use session auth',
      sessionId: 's1',
      timestamp: 't1',
    },
    {
      role: 'human',
      content: 'use JWT instead',
      sessionId: 's1',
      timestamp: 't2',
    },
  ],
};

let runDetector: typeof RunDetectorFn;

beforeAll(() => {
  mockAdvanceDetector.mockReturnValue(null);
  process.argv[2] = CWD;
  jest.isolateModules(() => {
    ({ runDetector } = require('@/scripts/runDetector'));
  });
  process.argv.splice(2, 1);
});

describe('runDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdvanceDetector.mockReturnValue(null);
  });

  test('does nothing when initial context is null', () => {
    runDetector(CWD);

    expect(mockSpawnDetectorAgent).not.toHaveBeenCalled();
  });

  test('advances without writing queue when agent output is null', () => {
    mockAdvanceDetector.mockReturnValueOnce(CONTEXT).mockReturnValueOnce(null);
    mockParseDetectorAgentOutput.mockReturnValue(null);

    runDetector(CWD);

    expect(mockAdvanceDetector).toHaveBeenCalledTimes(2);

    expect(mockWriteTriggersQueue).not.toHaveBeenCalled();
  });

  test('does not write queue or spawn summarizer when not a trigger', () => {
    mockAdvanceDetector.mockReturnValueOnce(CONTEXT).mockReturnValueOnce(null);
    mockParseDetectorAgentOutput.mockReturnValue({ isTrigger: false });

    runDetector(CWD);

    expect(mockWriteTriggersQueue).not.toHaveBeenCalled();
    expect(mockSpawnSummarizerScript).not.toHaveBeenCalled();
  });

  test('writes queue with human timestamp and spawns summarizer when trigger detected', () => {
    mockAdvanceDetector.mockReturnValueOnce(CONTEXT).mockReturnValueOnce(null);
    mockParseDetectorAgentOutput.mockReturnValue({ isTrigger: true });

    runDetector(CWD);

    expect(mockWriteTriggersQueue).toHaveBeenCalledWith(CWD, {
      timestamp: 't2',
    });

    expect(mockSpawnSummarizerScript).toHaveBeenCalledWith(CWD);
  });

  test('stops when same human timestamp is seen twice', () => {
    mockAdvanceDetector
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(CONTEXT);
    mockParseDetectorAgentOutput.mockReturnValue({ isTrigger: false });

    runDetector(CWD);

    expect(mockSpawnDetectorAgent).toHaveBeenCalledTimes(1);
  });

  test('processes multiple messages in sequence', () => {
    const CONTEXT_2: DetectorContext = {
      isFinished: false,
      messages: [
        { role: 'assistant', content: 'ok', sessionId: 's1', timestamp: 't3' },
        {
          role: 'human',
          content: 'actually no',
          sessionId: 's1',
          timestamp: 't4',
        },
      ],
    };

    mockAdvanceDetector
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(CONTEXT_2)
      .mockReturnValueOnce(null);
    mockParseDetectorAgentOutput.mockReturnValue({ isTrigger: false });

    runDetector(CWD);

    expect(mockSpawnDetectorAgent).toHaveBeenCalledTimes(2);
  });
});
