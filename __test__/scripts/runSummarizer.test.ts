import type { runSummarizer as RunSummarizerFn } from '@/scripts/runSummarizer';
import { advanceSummarizer } from '@/helpers/advanceSummarizer';
import { parseSummarizerAgentOutput } from '@/helpers/parseSummarizerAgentOutput';
import { spawnSummarizerAgent } from '@/helpers/spawnAgents';
import { findLatestEpisode } from '@/helpers/findLatestEpisode';
import { buildEpisodeFileName } from '@/helpers/buildEpisodeFileName';
import { buildPaths } from '@/helpers/buildPaths';
import { completeEpisode } from '@/helpers/completeEpisode';
import { writeMoment } from '@/helpers/writeMoment';
import { existsSync, readFileSync } from 'fs';
import type {
  SummarizerAgentEpisodeOutput,
  SummarizerAgentMomentOutput,
  SummarizerContext,
} from '@/types';

jest.mock('@/helpers/advanceSummarizer');
jest.mock('@/helpers/parseSummarizerAgentOutput');
jest.mock('@/helpers/spawnAgents');
jest.mock('@/helpers/findLatestEpisode');
jest.mock('@/helpers/buildEpisodeFileName');
jest.mock('@/helpers/buildPaths');
jest.mock('@/helpers/completeEpisode');
jest.mock('@/helpers/writeMoment');
jest.mock('fs');

const mockAdvanceSummarizer = jest.mocked(advanceSummarizer);
const mockParseSummarizerAgentOutput = jest.mocked(parseSummarizerAgentOutput);
const mockSpawnSummarizerAgent = jest.mocked(spawnSummarizerAgent);
const mockFindLatestEpisode = jest.mocked(findLatestEpisode);
const mockBuildEpisodeFileName = jest.mocked(buildEpisodeFileName);
const mockBuildPaths = jest.mocked(buildPaths);
const mockCompleteEpisode = jest.mocked(completeEpisode);
const mockWriteMoment = jest.mocked(writeMoment);
const mockExistsSync = jest.mocked(existsSync);
const mockReadFileSync = jest.mocked(readFileSync);

const CWD = '/cwd';
const STEERING_LOG_DIR = '/cwd/steering_log';
const LATEST_EPISODE = `${STEERING_LOG_DIR}/20260327143200-add-auth.md`;
const NEW_EPISODE = `${STEERING_LOG_DIR}/20260328091000-new-task.md`;
const NEW_EPISODE_FILENAME = '20260328091000-new-task.md';

const CONTEXT: SummarizerContext = {
  isFinished: false,
  humanMessages: 1,
  assistantMessages: 1,
  clearCount: 0,
  compactCount: 0,
  messages: [
    {
      role: 'assistant',
      content: 'here is your code',
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

const MOMENT_OUTPUT: SummarizerAgentMomentOutput = {
  isMoment: true,
  isNewEpisode: false,
  type: 'pushback',
  judgment: 'Rejected session auth in favor of JWT.',
  context: 'Claude was implementing session-based auth.',
};

const EPISODE_OUTPUT: SummarizerAgentEpisodeOutput = {
  isMoment: true,
  isNewEpisode: true,
  previousResult: 'completed',
  topic: 'New task',
  type: 'direction',
  judgment: 'Directed to start a new approach.',
  context: 'Claude had just finished the previous task.',
};

let runSummarizer: typeof RunSummarizerFn;

beforeAll(() => {
  mockAdvanceSummarizer.mockReturnValue(null);
  mockBuildPaths.mockReturnValue({ steeringLogDir: STEERING_LOG_DIR } as never);
  process.argv[2] = CWD;
  jest.isolateModules(() => {
    ({ runSummarizer } = require('@/scripts/runSummarizer'));
  });
  process.argv.splice(2, 1);
});

describe('runSummarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdvanceSummarizer.mockReturnValue(null);
    mockBuildPaths.mockReturnValue({
      steeringLogDir: STEERING_LOG_DIR,
    } as never);
    mockFindLatestEpisode.mockReturnValue(LATEST_EPISODE);
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('episode content' as never);
    mockBuildEpisodeFileName.mockReturnValue(NEW_EPISODE_FILENAME);
  });

  test('does nothing when initial context is null', () => {
    runSummarizer(CWD);

    expect(mockSpawnSummarizerAgent).not.toHaveBeenCalled();
  });

  test('advances without writing when agent output is null', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockParseSummarizerAgentOutput.mockReturnValue(null);

    runSummarizer(CWD);

    expect(mockAdvanceSummarizer).toHaveBeenCalledTimes(2);
    expect(mockWriteMoment).not.toHaveBeenCalled();
  });

  test('advances without writing when not a moment', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockParseSummarizerAgentOutput.mockReturnValue({ isMoment: false });

    runSummarizer(CWD);

    expect(mockWriteMoment).not.toHaveBeenCalled();
  });

  test('skips inconsistent response: same-episode but no latest episode', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockFindLatestEpisode.mockReturnValue(null);
    mockParseSummarizerAgentOutput.mockReturnValue(MOMENT_OUTPUT);

    runSummarizer(CWD);

    expect(mockWriteMoment).not.toHaveBeenCalled();
  });

  test('writes moment to existing episode path', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockParseSummarizerAgentOutput.mockReturnValue(MOMENT_OUTPUT);

    runSummarizer(CWD);

    expect(mockCompleteEpisode).not.toHaveBeenCalled();
    expect(mockWriteMoment).toHaveBeenCalledWith(
      MOMENT_OUTPUT,
      't2',
      LATEST_EPISODE,
    );
  });

  test('completes previous episode and writes to new path when isNewEpisode', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockParseSummarizerAgentOutput.mockReturnValue(EPISODE_OUTPUT);

    runSummarizer(CWD);

    expect(mockCompleteEpisode).toHaveBeenCalledWith({
      path: LATEST_EPISODE,
      result: 'completed',
    });
    expect(mockWriteMoment).toHaveBeenCalledWith(
      EPISODE_OUTPUT,
      't2',
      NEW_EPISODE,
    );
  });

  test('handles first ever episode: completeEpisode with null path', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockFindLatestEpisode.mockReturnValue(null);
    mockParseSummarizerAgentOutput.mockReturnValue(EPISODE_OUTPUT);

    runSummarizer(CWD);

    expect(mockCompleteEpisode).toHaveBeenCalledWith({
      path: null,
      result: 'completed',
    });
    expect(mockWriteMoment).toHaveBeenCalledWith(
      EPISODE_OUTPUT,
      't2',
      NEW_EPISODE,
    );
  });

  test('reads episode content and passes it to the agent', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockParseSummarizerAgentOutput.mockReturnValue(MOMENT_OUTPUT);

    runSummarizer(CWD);

    expect(mockSpawnSummarizerAgent).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('episode content') }),
    );
  });

  test('passes no-episode instruction to agent when no latest episode', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(null);
    mockFindLatestEpisode.mockReturnValue(null);
    mockParseSummarizerAgentOutput.mockReturnValue({ isMoment: false });

    runSummarizer(CWD);

    expect(mockSpawnSummarizerAgent).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('There is no current episode yet') }),
    );
  });

  test('stops when same human timestamp is seen twice', () => {
    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(CONTEXT);
    mockParseSummarizerAgentOutput.mockReturnValue(MOMENT_OUTPUT);

    runSummarizer(CWD);

    expect(mockSpawnSummarizerAgent).toHaveBeenCalledTimes(1);
  });

  test('processes multiple triggers in sequence', () => {
    const CONTEXT_2: SummarizerContext = {
      ...CONTEXT,
      messages: [
        {
          role: 'assistant',
          content: 'done',
          sessionId: 's1',
          timestamp: 't3',
        },
        {
          role: 'human',
          content: 'change the approach',
          sessionId: 's1',
          timestamp: 't4',
        },
      ],
    };

    mockAdvanceSummarizer
      .mockReturnValueOnce(CONTEXT)
      .mockReturnValueOnce(CONTEXT_2)
      .mockReturnValueOnce(null);
    mockParseSummarizerAgentOutput.mockReturnValue(MOMENT_OUTPUT);

    runSummarizer(CWD);

    expect(mockSpawnSummarizerAgent).toHaveBeenCalledTimes(2);
    expect(mockWriteMoment).toHaveBeenCalledTimes(2);
  });
});
