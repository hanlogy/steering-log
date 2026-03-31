import { buildPaths } from './buildPaths';
import { findMessage } from './findMessage';
import { readBufferLog } from './readBufferLog';
import { readDetectorContext } from './readDetectorContext';
import { writeContextFile } from './writeContextFile';
import type { DetectorContext } from '@/types';
import { existsSync } from 'fs';

/**
 * Builds a new `DetectorContext` from the next unprocessed entry in
 * `buffer.jsonl` and writes it to `detector-context.json`.
 *
 * Returns `DetectorContext` when a new context was written, `null` otherwise.
 *
 * Returns `null` without writing a new context when:
 * - `buffer.jsonl` does not exist.
 * - A context already exists with `isFinished: false` and `force` is `false`.
 * - All pending human messages lack a preceding assistant message.
 * - No unprocessed human messages remain in the buffer.
 *
 * Skips queue entries whose human message has no preceding assistant message
 * (e.g. the very first message in a session) and advances to the next entry.
 *
 * Returns `null` after writing when the buffer is fully caught up and an
 * existing context has `isFinished: false`: it writes `isFinished: true` to
 * finalize it so the spawning guard does not block future runs.
 *
 * `force` skips the `isFinished` guard, allowing the context to be overwritten
 * even when the previous classification is not yet marked finished. This is used
 * exclusively by the Detector's post script to advance to the next queue item:
 * because `isFinished` is only set to `true` after the buffer is exhausted, it
 * will always be `false` when there are more items to process.
 */
export function advanceDetector(
  cwd: string,
  { force = false }: { force?: boolean } = {},
): DetectorContext | null {
  const { bufferPath, detectorContextPath } = buildPaths(cwd);

  if (!existsSync(bufferPath)) {
    return null;
  }

  const detectorContext = readDetectorContext(detectorContextPath);

  if (detectorContext) {
    if (!force && !detectorContext.isFinished) {
      return null;
    }
  }

  const lastProcessedTimestamp = findMessage(detectorContext?.messages ?? [], {
    role: 'human',
    type: 'newest',
  })?.timestamp;

  const messageEntries = readBufferLog(bufferPath).filter((e) => 'role' in e);

  let hasNewHumanMessages = false;

  for (let i = 0; i < messageEntries.length; i++) {
    const entry = messageEntries[i];

    if (entry?.role !== 'human') {
      continue;
    }

    if (lastProcessedTimestamp && entry.timestamp <= lastProcessedTimestamp) {
      continue;
    }

    hasNewHumanMessages = true;

    const assistantMessage = findMessage(messageEntries.slice(0, i), {
      role: 'assistant',
      type: 'newest',
    });

    if (!assistantMessage) {
      continue;
    }

    const context = {
      isFinished: false,
      messages: [assistantMessage, entry],
    };

    writeContextFile(detectorContextPath, context);

    return context;
  }

  if (!hasNewHumanMessages && detectorContext && !detectorContext.isFinished) {
    writeContextFile(detectorContextPath, {
      ...detectorContext,
      isFinished: true,
    });
  }

  return null;
}
