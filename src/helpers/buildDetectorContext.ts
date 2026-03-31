import type { DetectorContext, JsonRecord } from '@/types';
import { isJsonArray } from './checkTypes';
import { buildMessageEntries } from './buildMessageEntries';

export function buildDetectorContext({
  messages: rawMessages,
  isFinished,
}: JsonRecord): DetectorContext | null {
  if (!isJsonArray(rawMessages) || typeof isFinished !== 'boolean') {
    return null;
  }

  const messages = buildMessageEntries(rawMessages);

  if (!messages.length) {
    return null;
  }

  return { messages, isFinished };
}
