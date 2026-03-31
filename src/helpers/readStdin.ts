import { readFileSync } from 'fs';
import type { StdinPayload } from '@/types';
import { isJsonRecord, isOneOf } from '@/helpers/checkTypes';
import { HOOK_EVENT_NAMES } from '@/constants';

export function readStdin(): StdinPayload | null {
  const dataLike: unknown = JSON.parse(readFileSync('/dev/stdin', 'utf-8'));

  if (!isJsonRecord(dataLike)) {
    return null;
  }

  const {
    session_id: sessionId,
    cwd,
    hook_event_name: hookEventName,
    ...data
  } = dataLike;

  if (
    typeof sessionId !== 'string' ||
    typeof cwd !== 'string' ||
    typeof hookEventName !== 'string' ||
    !isOneOf(HOOK_EVENT_NAMES, hookEventName)
  ) {
    return null;
  }

  return { sessionId, cwd, hookEventName, data };
}
