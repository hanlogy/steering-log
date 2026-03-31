import type { BufferEntry } from '@/types';
import { readFileSync } from 'fs';
import { isJsonRecord } from './checkTypes';
import { buildMessageEntry } from './buildMessageEntry';
import { buildCommandEntry } from './buildCommandEntry';

export function readBufferLog(path: string): BufferEntry[] {
  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .reduce<BufferEntry[]>((acc, l) => {
      try {
        const parsed: unknown = JSON.parse(l);
        if (!isJsonRecord(parsed)) {
          return acc;
        }
        const message = buildMessageEntry(parsed);
        if (message) {
          acc.push(message);
          return acc;
        }
        const command = buildCommandEntry(parsed);
        if (command) {
          acc.push(command);
        }
        return acc;
      } catch {
        return acc;
      }
    }, []);
}
