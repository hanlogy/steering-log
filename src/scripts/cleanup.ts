import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { buildPaths } from '@/helpers/buildPaths';
import { readBufferLog } from '@/helpers/readBufferLog';
import { readDetectorContext } from '@/helpers/readDetectorContext';
import { readSummarizerContext } from '@/helpers/readSummarizerContext';
import { readTimestampQueue } from '@/helpers/readTimestampQueue';
import { readStdin } from '@/helpers/readStdin';
import {
  spawnDetectorScript,
  spawnSummarizerScript,
} from '@/helpers/spawnScripts';
import { safeGuard } from '@/helpers/safeGuard';

safeGuard();

const stdin = readStdin();

if (!stdin) {
  process.exit(0);
}

const { cwd, hookEventName, data } = stdin;

if (hookEventName !== 'SessionStart' || data['source'] !== 'startup') {
  process.exit(0);
}

const {
  bufferPath,
  triggersQueuePath,
  detectorContextPath,
  summarizerContextPath,
  steeringLogDir,
} = buildPaths(cwd);

mkdirSync(steeringLogDir, { recursive: true });

// Handle detector context
const detectorContext = readDetectorContext(detectorContextPath);

if (detectorContext) {
  const humanMessage = detectorContext.messages.find((m) => m.role === 'human');

  if (humanMessage) {
    if (detectorContext.isFinished) {
      truncateBuffer(humanMessage.timestamp);
    } else {
      const triggerTimestamps = readTimestampQueue(triggersQueuePath);
      const lastTrigger = triggerTimestamps[triggerTimestamps.length - 1];

      if (lastTrigger) {
        truncateBuffer(lastTrigger);
      }
    }
  }

  rmSync(detectorContextPath);
}

// Handle summarizer context
const summarizerContext = readSummarizerContext(summarizerContextPath);

if (summarizerContext) {
  const firstMessage = summarizerContext.messages[0];
  const lastMessage =
    summarizerContext.messages[summarizerContext.messages.length - 1];

  if (summarizerContext.isFinished) {
    if (lastMessage) {
      truncateTriggersQueue(lastMessage.timestamp);
    }
  } else {
    if (firstMessage) {
      truncateTriggersQueue(firstMessage.timestamp);
    }
  }

  rmSync(summarizerContextPath);
}

// Spawn agents if unprocessed work remains
if (existsSync(bufferPath)) {
  const hasHumanMessages = readBufferLog(bufferPath).some(
    (e) => 'role' in e && e.role === 'human',
  );

  if (hasHumanMessages) {
    spawnDetectorScript(cwd);
  }
}

const remainingTriggers = readTimestampQueue(triggersQueuePath);

if (remainingTriggers.length > 0) {
  spawnSummarizerScript(cwd);
}

function truncateBuffer(cutoffTimestamp: string): void {
  if (!existsSync(bufferPath)) {
    return;
  }

  const remaining = readFileSync(bufferPath, 'utf-8')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return false;
      }

      try {
        const entry: unknown = JSON.parse(trimmed);

        if (
          typeof entry === 'object' &&
          entry !== null &&
          'timestamp' in entry &&
          typeof (entry as { timestamp: unknown }).timestamp === 'string'
        ) {
          return (entry as { timestamp: string }).timestamp > cutoffTimestamp;
        }
      } catch {
        // keep unparseable lines
      }

      return true;
    });

  writeFileSync(
    bufferPath,
    remaining.length > 0 ? remaining.join('\n') + '\n' : '',
  );
}

function truncateTriggersQueue(cutoffTimestamp: string): void {
  if (!existsSync(triggersQueuePath)) {
    return;
  }

  const remaining = readTimestampQueue(triggersQueuePath).filter(
    (ts) => ts > cutoffTimestamp,
  );

  writeFileSync(triggersQueuePath, remaining.map((ts) => `${ts}\n`).join(''));
}
