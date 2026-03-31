import { extractJsonRecord } from '@/helpers/extractJsonRecord';
import { parseDetectorAgentOutput } from '@/helpers/parseDetectorAgentOutput';

jest.mock('@/helpers/extractJsonRecord');

const mockExtractJsonRecord = jest.mocked(extractJsonRecord);

describe('parseDetectorAgentOutput', () => {
  beforeEach(() => {
    mockExtractJsonRecord.mockReset();
  });

  test('returns null when stdout is null', () => {
    expect(parseDetectorAgentOutput(null)).toBeNull();
  });

  test('returns null when extractJsonRecord returns null', () => {
    mockExtractJsonRecord.mockReturnValue(null);
    expect(parseDetectorAgentOutput('some output')).toBeNull();
  });

  test('returns null when is_trigger field is missing', () => {
    mockExtractJsonRecord.mockReturnValue({ reason: 'no trigger field' });
    expect(parseDetectorAgentOutput('some output')).toBeNull();
  });

  test('returns null when is_trigger is not a boolean', () => {
    mockExtractJsonRecord.mockReturnValue({ is_trigger: 'true' });
    expect(parseDetectorAgentOutput('some output')).toBeNull();
  });

  test('returns { isTrigger: true } when is_trigger is true', () => {
    mockExtractJsonRecord.mockReturnValue({ is_trigger: true });
    expect(parseDetectorAgentOutput('some output')).toStrictEqual({
      isTrigger: true,
    });
  });

  test('returns { isTrigger: false } when is_trigger is false', () => {
    mockExtractJsonRecord.mockReturnValue({ is_trigger: false });
    expect(parseDetectorAgentOutput('some output')).toStrictEqual({
      isTrigger: false,
    });
  });

  test('ignores extra fields and only maps is_trigger', () => {
    mockExtractJsonRecord.mockReturnValue({
      is_trigger: true,
      extra: 'ignored',
    });
    expect(parseDetectorAgentOutput('some output')).toStrictEqual({
      isTrigger: true,
    });
  });
});
