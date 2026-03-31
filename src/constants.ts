export const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
export const SONNET_MODEL = 'claude-sonnet-4-6';

export const STEERING_LOG_DIR = 'steering_log';
export const CONVERSATION_DIR = '.conversation';
export const BUFFER_FILE = 'buffer.jsonl';
export const TRIGGERS_QUEUE_FILE = 'triggers-queue.txt';
export const DETECTOR_CONTEXT_FILE = 'detector-context.json';
export const SUMMARIZER_CONTEXT_FILE = 'summarizer-context.json';

export const STEERING_TYPES = [
  'pushback',
  'direction',
  'correction',
  'scope-change',
  'preference',
] as const;

export const EPISODE_RESULTS = [
  'completed',
  'paused',
  'cancelled',
  'failed',
  'unknown',
] as const;

export const HOOK_EVENT_NAMES = [
  'SessionStart',
  'PostCompact',
  'SessionEnd',
  'Stop',
  'UserPromptSubmit',
] as const;

export const SCRIPTS_DIR = 'scripts/';
export const CLEANUP_SCRIPT = 'cleanup.js';
export const APPEND_TO_BUFFER_SCRIPT = 'appendToBuffer.js';
export const RUN_DETECTOR_SCRIPT = 'runDetector.js';
export const RUN_SUMMARIZER_SCRIPT = 'runSummarizer.js';
