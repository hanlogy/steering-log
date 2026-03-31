import { buildPaths } from './buildPaths';
import { findMessage } from './findMessage';
import { readBufferLog } from './readBufferLog';
import { readSummarizerContext } from './readSummarizerContext';
import { readTimestampQueue } from './readTimestampQueue';
import { writeContextFile } from './writeContextFile';
import type { MessageEntry, SummarizerContext } from '@/types';
import { existsSync } from 'fs';

/**
 * Reads `triggers-queue.txt` and builds a new `SummarizerContext` and writes it
 * to `summarizer-context.json`.
 *
 * Returns `SummarizerContext` when a new context was written, `null` otherwise.
 *
 * Returns `null` without writing a new context when:
 * - `buffer.jsonl` does not exist.
 * - A context already exists with `isFinished: false` and `force` is `false`.
 * - No unprocessed triggers remain in the queue(set isFinished to true, if it
 * is false).
 *
 * `force` skips the `isFinished` guard, allowing the context to be overwritten
 * even when the previous analysis is not yet marked finished. Used exclusively
 * by the Summarizer's post script to advance to the next queue item.
 */
export function advanceSummarizer(
  cwd: string,
  { force = false }: { force?: boolean } = {},
): SummarizerContext | null {
  const { bufferPath, triggersQueuePath, summarizerContextPath } =
    buildPaths(cwd);

  if (!existsSync(bufferPath)) {
    return null;
  }

  const summarizerContext = readSummarizerContext(summarizerContextPath);

  if (summarizerContext) {
    if (!force && !summarizerContext.isFinished) {
      return null;
    }
  }

  const triggerTimestamps = readTimestampQueue(triggersQueuePath);

  const lastToTime =
    findMessage(summarizerContext?.messages ?? [], {
      role: 'human',
      type: 'newest',
    })?.timestamp ?? null;

  let nextTriggerTimestamp: string | null = null;

  for (const ts of triggerTimestamps) {
    if (!lastToTime || ts > lastToTime) {
      nextTriggerTimestamp = ts;
      break;
    }
  }

  if (!nextTriggerTimestamp) {
    if (summarizerContext && !summarizerContext.isFinished) {
      writeContextFile(summarizerContextPath, {
        ...summarizerContext,
        isFinished: true,
      });
    }

    return null;
  }

  const toTime = nextTriggerTimestamp;
  const bufferEntries = readBufferLog(bufferPath);

  const windowMessages: MessageEntry[] = [];
  let clearCount = 0;
  let compactCount = 0;

  for (const entry of bufferEntries) {
    if (entry.timestamp > toTime) {
      break;
    }

    if (lastToTime !== null && entry.timestamp <= lastToTime) {
      continue;
    }

    if ('command' in entry) {
      switch (entry.command) {
        case 'clear':
          clearCount++;
          break;
        case 'compact':
          compactCount++;
          break;
      }
    } else {
      windowMessages.push(entry);
    }
  }

  const humanMessages = windowMessages.filter((m) => m.role === 'human').length;
  const assistantMessages = windowMessages.filter(
    (m) => m.role === 'assistant',
  ).length;

  const context: SummarizerContext = {
    isFinished: false,
    humanMessages,
    assistantMessages,
    clearCount,
    compactCount,
    messages: windowMessages,
  };

  writeContextFile(summarizerContextPath, context);

  return context;
}
