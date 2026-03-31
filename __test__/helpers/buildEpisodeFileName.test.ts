import { getDateParts } from '@/helpers/getTimeParts';
import { buildEpisodeFileName } from '@/helpers/buildEpisodeFileName';

jest.mock('@/helpers/getTimeParts');

const mockGetDateParts = jest.mocked(getDateParts);

const DATE_PARTS = {
  year: '2026',
  month: '03',
  day: '27',
  hours: '14',
  minutes: '32',
  seconds: '00',
};

describe('buildEpisodeFileName', () => {
  beforeEach(() => {
    mockGetDateParts.mockReturnValue(DATE_PARTS);
  });

  test('builds filename from timestamp and topic', () => {
    expect(buildEpisodeFileName('ts', 'Add auth middleware')).toBe(
      '20260327143200-add-auth-middleware.md',
    );
  });

  test('lowercases the slug', () => {
    expect(buildEpisodeFileName('ts', 'Fix Bug')).toBe(
      '20260327143200-fix-bug.md',
    );
  });

  test('removes special characters', () => {
    expect(buildEpisodeFileName('ts', 'Fix bug #123!')).toBe(
      '20260327143200-fix-bug-123.md',
    );
  });

  test('collapses multiple spaces into a single hyphen', () => {
    expect(buildEpisodeFileName('ts', 'A  B   C')).toBe(
      '20260327143200-a-b-c.md',
    );
  });

  test('trims leading and trailing hyphens from slug', () => {
    expect(buildEpisodeFileName('ts', '!hello!')).toBe(
      '20260327143200-hello.md',
    );
  });
});
