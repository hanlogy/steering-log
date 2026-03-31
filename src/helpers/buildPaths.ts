import {
  BUFFER_FILE,
  CONVERSATION_DIR,
  DETECTOR_CONTEXT_FILE,
  STEERING_LOG_DIR,
  SUMMARIZER_CONTEXT_FILE,
  TRIGGERS_QUEUE_FILE,
} from '@/constants';
import { join } from 'path';

export function buildPaths(cwd: string): {
  steeringLogDir: string;
  conversationDir: string;
  detectorContextPath: string;
  summarizerContextPath: string;
  bufferPath: string;
  triggersQueuePath: string;
} {
  const steeringLogDir = join(cwd, STEERING_LOG_DIR);
  const conversationDir = join(steeringLogDir, CONVERSATION_DIR);
  const detectorContextPath = join(conversationDir, DETECTOR_CONTEXT_FILE);
  const summarizerContextPath = join(conversationDir, SUMMARIZER_CONTEXT_FILE);
  const bufferPath = join(conversationDir, BUFFER_FILE);
  const triggersQueuePath = join(conversationDir, TRIGGERS_QUEUE_FILE);

  return {
    steeringLogDir,
    conversationDir,
    detectorContextPath,
    summarizerContextPath,
    bufferPath,
    triggersQueuePath,
  };
}
