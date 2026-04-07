import { appendFileSync, writeFileSync } from 'fs';
import type { MessageEntry } from '@/types';
import { getDateParts } from './getTimeParts';

function formatMessage(message: MessageEntry): string {
  const { year, month, day, hours, minutes, seconds } = getDateParts(
    message.timestamp,
  );
  const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return `[${message.role} ${datetime}]:\n${message.content}`;
}

export function writeTranscript({
  messages,
  triggerTimestamp,
  episodePath,
  isNewEpisode,
  type,
  topic,
}: {
  messages: readonly MessageEntry[];
  triggerTimestamp: string;
  episodePath: string;
  isNewEpisode: boolean;
  type: string;
  topic?: string;
}): void {
  const transcriptPath = episodePath.replace(/\.md$/, '.transcript.md');

  const { year, month, day, hours, minutes } = getDateParts(triggerTimestamp);
  const datetime = `${year}-${month}-${day} ${hours}:${minutes}`;

  const section = [
    `## ${datetime} ${type}`,
    ...messages.map(formatMessage),
  ].join('\n\n');

  if (isNewEpisode) {
    const heading = topic ? `# ${topic}\n\n` : '';
    writeFileSync(transcriptPath, `${heading}${section}\n`);
  } else {
    appendFileSync(transcriptPath, `\n\n---\n\n${section}\n`);
  }
}
