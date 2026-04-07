import { appendFileSync, writeFileSync } from 'fs';
import { getDateParts } from '@/helpers/getTimeParts';
import { writeTranscript } from '@/helpers/writeTranscript';
import type { MessageEntry } from '@/types';

jest.mock('fs');
jest.mock('@/helpers/getTimeParts');

const mockWriteFileSync = jest.mocked(writeFileSync);
const mockAppendFileSync = jest.mocked(appendFileSync);
const mockGetDateParts = jest.mocked(getDateParts);

const EPISODE_PATH = '/project/steering_log/20260327143200-add-auth.md';
const TRANSCRIPT_PATH =
  '/project/steering_log/20260327143200-add-auth.transcript.md';

const TRIGGER_DATE_PARTS = {
  year: '2026',
  month: '03',
  day: '27',
  hours: '14',
  minutes: '32',
  seconds: '00',
};

const ASSISTANT_DATE_PARTS = {
  year: '2026',
  month: '03',
  day: '27',
  hours: '14',
  minutes: '30',
  seconds: '45',
};

const HUMAN_DATE_PARTS = {
  year: '2026',
  month: '03',
  day: '27',
  hours: '14',
  minutes: '32',
  seconds: '11',
};

const MESSAGES: MessageEntry[] = [
  {
    role: 'assistant',
    content: 'Here is my proposed implementation.',
    sessionId: 'session-1',
    timestamp: '2026-03-27T14:30:45.000Z',
  },
  {
    role: 'human',
    content: 'Use JWT instead.',
    sessionId: 'session-1',
    timestamp: '2026-03-27T14:32:11.000Z',
  },
];

describe('writeTranscript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDateParts
      .mockReturnValueOnce(TRIGGER_DATE_PARTS)
      .mockReturnValueOnce(ASSISTANT_DATE_PARTS)
      .mockReturnValueOnce(HUMAN_DATE_PARTS);
  });

  test('creates new transcript file with topic heading for new episode', () => {
    writeTranscript({
      messages: MESSAGES,
      triggerTimestamp: '2026-03-27T14:32:11.000Z',
      episodePath: EPISODE_PATH,
      isNewEpisode: true,
      type: 'pushback',
      topic: 'Add auth middleware',
    });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      TRANSCRIPT_PATH,
      '# Add auth middleware\n\n## 2026-03-27 14:32 pushback\n\n[assistant 2026-03-27 14:30:45]:\nHere is my proposed implementation.\n\n[human 2026-03-27 14:32:11]:\nUse JWT instead.\n',
    );
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  test('creates new transcript file without heading when topic is absent', () => {
    writeTranscript({
      messages: MESSAGES,
      triggerTimestamp: '2026-03-27T14:32:11.000Z',
      episodePath: EPISODE_PATH,
      isNewEpisode: true,
      type: 'direction',
    });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      TRANSCRIPT_PATH,
      '## 2026-03-27 14:32 direction\n\n[assistant 2026-03-27 14:30:45]:\nHere is my proposed implementation.\n\n[human 2026-03-27 14:32:11]:\nUse JWT instead.\n',
    );
  });

  test('appends section with separator to existing transcript', () => {
    writeTranscript({
      messages: MESSAGES,
      triggerTimestamp: '2026-03-27T14:32:11.000Z',
      episodePath: EPISODE_PATH,
      isNewEpisode: false,
      type: 'correction',
    });

    expect(mockAppendFileSync).toHaveBeenCalledWith(
      TRANSCRIPT_PATH,
      '\n\n---\n\n## 2026-03-27 14:32 correction\n\n[assistant 2026-03-27 14:30:45]:\nHere is my proposed implementation.\n\n[human 2026-03-27 14:32:11]:\nUse JWT instead.\n',
    );
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test('derives transcript path from episode path', () => {
    writeTranscript({
      messages: MESSAGES,
      triggerTimestamp: '2026-03-27T14:32:11.000Z',
      episodePath: EPISODE_PATH,
      isNewEpisode: true,
      type: 'pushback',
      topic: 'Add auth middleware',
    });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      TRANSCRIPT_PATH,
      expect.any(String),
    );
  });
});
