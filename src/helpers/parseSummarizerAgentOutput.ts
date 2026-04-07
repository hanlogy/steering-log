import type { SummarizerAgentOutput } from '@/types';
import { extractJsonRecord } from './extractJsonRecord';
import { EPISODE_RESULTS, STEERING_TYPES } from '@/constants';
import { isOneOf } from './checkTypes';

export function parseSummarizerAgentOutput(
  stdout?: string | null,
): SummarizerAgentOutput | null {
  if (!stdout) {
    return null;
  }

  const jsonRecord = extractJsonRecord(stdout);

  if (!jsonRecord) {
    return null;
  }

  const {
    is_moment,
    is_new_episode,
    previous_result,
    topic,
    type,
    judgment,
    context,
  } = jsonRecord;

  if (typeof is_moment !== 'boolean') {
    return null;
  }

  if (!is_moment) {
    return { isMoment: false };
  }

  if (
    !isOneOf(STEERING_TYPES, type) ||
    typeof judgment !== 'string' ||
    typeof context !== 'string'
  ) {
    return null;
  }

  if (is_new_episode !== true) {
    return {
      isMoment: true,
      isNewEpisode: false,
      type,
      judgment,
      context,
    };
  }

  if (typeof topic !== 'string') {
    return null;
  }

  return {
    isMoment: true,
    isNewEpisode: true,
    previousResult: isOneOf(EPISODE_RESULTS, previous_result)
      ? previous_result
      : undefined,
    topic,
    type,
    judgment,
    context,
  };
}
