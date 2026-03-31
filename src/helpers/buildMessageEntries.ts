import type { JsonValue, MessageEntry } from '@/types';
import { buildMessageEntry } from './buildMessageEntry';
import { isJsonRecord } from './checkTypes';

export function buildMessageEntries(data: JsonValue[]): MessageEntry[] {
  return data
    .map((e) => (isJsonRecord(e) ? buildMessageEntry(e) : null))
    .filter((e): e is MessageEntry => e !== null);
}
