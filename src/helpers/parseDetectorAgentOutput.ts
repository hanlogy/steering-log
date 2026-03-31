import type { DetectorAgentOutput } from '@/types';
import { extractJsonRecord } from './extractJsonRecord';

export function parseDetectorAgentOutput(
  stdout?: string | null,
): DetectorAgentOutput | null {
  if (!stdout) {
    return null;
  }

  const jsonRecord = extractJsonRecord(stdout);

  if (!jsonRecord) {
    return null;
  }

  const { is_trigger: isTrigger } = jsonRecord;

  if (typeof isTrigger !== 'boolean') {
    return null;
  }

  return { isTrigger };
}
