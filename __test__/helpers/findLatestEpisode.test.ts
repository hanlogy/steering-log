import { existsSync, readdirSync } from 'fs';
import { findLatestEpisode } from '@/helpers/findLatestEpisode';

jest.mock('fs');

const mockExistsSync = jest.mocked(existsSync);
const mockReaddirSync = jest.mocked(readdirSync);

const DIR = '/project/steering_log';

describe('findLatestEpisode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  test('returns null when directory does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    expect(findLatestEpisode(DIR)).toBeNull();
  });

  test('returns null when directory has no .md files', () => {
    mockReaddirSync.mockReturnValue([] as never);

    expect(findLatestEpisode(DIR)).toBeNull();
  });

  test('returns null when directory has only non-.md files', () => {
    mockReaddirSync.mockReturnValue(['data.json', 'notes.txt'] as never);

    expect(findLatestEpisode(DIR)).toBeNull();
  });

  test('returns the path when there is a single .md file', () => {
    mockReaddirSync.mockReturnValue(['20260327143200-add-auth.md'] as never);

    expect(findLatestEpisode(DIR)).toBe(`${DIR}/20260327143200-add-auth.md`);
  });

  test('returns the lexicographically last .md file among multiple', () => {
    mockReaddirSync.mockReturnValue([
      '20260327143200-add-auth.md',
      '20260328091000-fix-bug.md',
      '20260326110000-initial-setup.md',
    ] as never);

    expect(findLatestEpisode(DIR)).toBe(`${DIR}/20260328091000-fix-bug.md`);
  });

  test('ignores non-.md files when selecting the latest', () => {
    mockReaddirSync.mockReturnValue([
      '20260327143200-add-auth.md',
      'zzz-not-an-episode.txt',
    ] as never);

    expect(findLatestEpisode(DIR)).toBe(`${DIR}/20260327143200-add-auth.md`);
  });

  test('ignores .transcript.md files when selecting the latest', () => {
    mockReaddirSync.mockReturnValue([
      '20260327143200-add-auth.md',
      '20260327143200-add-auth.transcript.md',
    ] as never);

    expect(findLatestEpisode(DIR)).toBe(`${DIR}/20260327143200-add-auth.md`);
  });
});
