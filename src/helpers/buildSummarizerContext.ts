import type { JsonRecord, SummarizerContext } from '@/types';
import { isJsonArray } from './checkTypes';
import { buildMessageEntries } from './buildMessageEntries';

export function buildSummarizerContext({
  isFinished,
  humanMessages,
  assistantMessages,
  clearCount,
  compactCount,
  messages: rawMessages,
}: JsonRecord): SummarizerContext | null {
  if (
    typeof isFinished !== 'boolean' ||
    typeof humanMessages !== 'number' ||
    typeof assistantMessages !== 'number' ||
    typeof clearCount !== 'number' ||
    typeof compactCount !== 'number' ||
    !isJsonArray(rawMessages)
  ) {
    return null;
  }

  const messages = buildMessageEntries(rawMessages);

  return {
    isFinished,
    humanMessages,
    assistantMessages,
    clearCount,
    compactCount,
    messages,
  };
}
