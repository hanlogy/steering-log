import type {
  SummarizerAgentEpisodeOutput,
  SummarizerAgentMomentOutput,
} from '@/types';
import { appendFileSync, writeFileSync } from 'fs';
import { getDateParts } from './getTimeParts';

export function writeMoment(
  output: SummarizerAgentMomentOutput | SummarizerAgentEpisodeOutput,
  triggerTimestamp: string,
  episodePath: string,
): void {
  const { year, month, day, hours, minutes } = getDateParts(triggerTimestamp);
  const datetime = `${year}-${month}-${day} ${hours}:${minutes}`;

  const { type, judgment, context } = output;
  const moment = [
    `## ${datetime} ${type}`,
    `### Judgment\n\n${judgment}`,
    `### Context\n\n${context}`,
  ].join('\n\n');

  if (output.isNewEpisode) {
    writeFileSync(episodePath, `# ${output.topic}\n\n${moment}\n`);
  } else {
    appendFileSync(episodePath, `\n\n${moment}\n`);
  }
}
