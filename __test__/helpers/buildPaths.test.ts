import { buildPaths } from '@/helpers/buildPaths';
import { join } from 'path';

jest.mock('@/constants', () => ({
  STEERING_LOG_DIR: 'steering-log',
  CONVERSATION_DIR: 'conversation-dir',
  BUFFER_FILE: 'buffer-file',
  TRIGGERS_QUEUE_FILE: 'triggers-queue-file',
  DETECTOR_CONTEXT_FILE: 'detector-context-json',
  SUMMARIZER_CONTEXT_FILE: 'summarizer-context-json',
}));

test('buildPaths', () => {
  const cwd = '/some/absolute/path';
  const result = buildPaths(cwd);

  expect(result.steeringLogDir).toBe(join(cwd, 'steering-log'));
  expect(result.conversationDir).toBe(
    join(cwd, 'steering-log', 'conversation-dir'),
  );
  expect(result.detectorContextPath).toBe(
    join(cwd, 'steering-log', 'conversation-dir', 'detector-context-json'),
  );
  expect(result.summarizerContextPath).toBe(
    join(cwd, 'steering-log', 'conversation-dir', 'summarizer-context-json'),
  );
  expect(result.bufferPath).toBe(
    join(cwd, 'steering-log', 'conversation-dir', 'buffer-file'),
  );
  expect(result.triggersQueuePath).toBe(
    join(cwd, 'steering-log', 'conversation-dir', 'triggers-queue-file'),
  );
});
