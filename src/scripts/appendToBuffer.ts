import { readStdin } from '@/helpers/readStdin';
import { buildPaths } from '@/helpers/buildPaths';
import { appendFileSync, mkdirSync } from 'fs';
import type { CommandEntry, HookEventName, MessageEntry } from '@/types';
import { spawnDetectorScript } from '@/helpers/spawnScripts';
import { safeGuard } from '@/helpers/safeGuard';

safeGuard();

export function handleHookEvent(): {
  cwd: string;
  hookEventName: HookEventName;
} | null {
  const stdin = readStdin();

  if (!stdin) {
    return null;
  }

  const { sessionId, cwd, hookEventName, data } = stdin;

  let _bufferPath: string | null = null;

  const getBufferPath = (): string => {
    if (!_bufferPath) {
      const { conversationDir, bufferPath } = buildPaths(cwd);
      mkdirSync(conversationDir, { recursive: true });
      _bufferPath = bufferPath;
    }

    return _bufferPath;
  };

  const append = (
    data:
      | Pick<MessageEntry, 'role' | 'content'>
      | Pick<CommandEntry, 'command'>,
  ): void => {
    appendFileSync(
      getBufferPath(),
      JSON.stringify({
        ...data,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      }) + '\n',
    );
  };

  switch (hookEventName) {
    case 'PostCompact':
      append({ command: 'compact' });
      break;

    case 'SessionEnd': {
      const { reason } = data;

      if (reason === 'clear') {
        append({ command: 'clear' });
      }

      break;
    }

    case 'Stop': {
      const { last_assistant_message: content } = data;

      if (typeof content === 'string') {
        append({ role: 'assistant', content });
      }

      break;
    }

    case 'UserPromptSubmit': {
      const { prompt: content } = data;

      if (typeof content === 'string') {
        append({ role: 'human', content });
      }

      break;
    }
  }

  return { cwd, hookEventName };
}

const result = handleHookEvent();

if (!result) {
  process.exit(0);
}

if (result.hookEventName === 'UserPromptSubmit') {
  spawnDetectorScript(result.cwd);
}
