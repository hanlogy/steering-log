import { appendFileSync, existsSync, readFileSync } from 'fs';
import { completeEpisode } from '@/helpers/completeEpisode';

jest.mock('fs');

const mockExistsSync = jest.mocked(existsSync);
const mockReadFileSync = jest.mocked(readFileSync);
const mockAppendFileSync = jest.mocked(appendFileSync);

const PATH = '/project/steering_log/20260327143200-add-auth.md';

describe('completeEpisode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  test('does nothing when path is null', () => {
    completeEpisode({ path: null, result: 'completed' });

    expect(mockExistsSync).not.toHaveBeenCalled();
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  test('does nothing when file does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    completeEpisode({ path: PATH, result: 'completed' });

    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  test('appends Result line when not already present', () => {
    mockReadFileSync.mockReturnValue(
      '## 2026-03-27 14:32 pushback\n\n...' as never,
    );

    completeEpisode({ path: PATH, result: 'completed' });

    expect(mockAppendFileSync).toHaveBeenCalledWith(
      PATH,
      '\n\n---\n\n**Result**: completed',
    );
  });

  test('does nothing when file already ends with a Result line', () => {
    mockReadFileSync.mockReturnValue(
      '## 2026-03-27 14:32 pushback\n\n---\n\n**Result**: completed' as never,
    );

    completeEpisode({ path: PATH, result: 'failed' });

    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  test('does nothing when Result line has trailing whitespace', () => {
    mockReadFileSync.mockReturnValue('**Result**: completed\n\n' as never);

    completeEpisode({ path: PATH, result: 'failed' });

    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });
});
