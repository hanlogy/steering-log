import { appendFileSync, writeFileSync } from 'fs';
import { getDateParts } from '@/helpers/getTimeParts';
import { writeMoment } from '@/helpers/writeMoment';
import type {
  SummarizerAgentEpisodeOutput,
  SummarizerAgentMomentOutput,
} from '@/types';

jest.mock('fs');
jest.mock('@/helpers/getTimeParts');

const mockWriteFileSync = jest.mocked(writeFileSync);
const mockAppendFileSync = jest.mocked(appendFileSync);
const mockGetDateParts = jest.mocked(getDateParts);

const PATH = '/project/steering_log/20260327143200-add-auth.md';

const MOMENT_OUTPUT: SummarizerAgentMomentOutput = {
  isMoment: true,
  isNewEpisode: false,
  type: 'pushback',
  judgment: 'Rejected the proposed approach.',
  context: 'Claude was suggesting an alternative.',
};

const EPISODE_OUTPUT: SummarizerAgentEpisodeOutput = {
  isMoment: true,
  isNewEpisode: true,
  previousResult: 'completed',
  topic: 'Add auth middleware',
  type: 'direction',
  judgment: 'Directed to use JWT.',
  context: 'Claude was implementing session auth.',
};

describe('writeMoment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDateParts.mockReturnValue({
      year: '2026',
      month: '03',
      day: '27',
      hours: '14',
      minutes: '32',
      seconds: '00',
    });
  });

  test('appends moment section to existing episode', () => {
    writeMoment(MOMENT_OUTPUT, 'ts', PATH);

    expect(mockAppendFileSync).toHaveBeenCalledWith(
      PATH,
      '\n\n## 2026-03-27 14:32 pushback\n\n### Judgment\n\nRejected the proposed approach.\n\n### Context\n\nClaude was suggesting an alternative.\n',
    );
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test('creates new episode file with topic heading', () => {
    writeMoment(EPISODE_OUTPUT, 'ts', PATH);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      PATH,
      '# Add auth middleware\n\n## 2026-03-27 14:32 direction\n\n### Judgment\n\nDirected to use JWT.\n\n### Context\n\nClaude was implementing session auth.\n',
    );
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });
});
