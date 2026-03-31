import { join } from 'path';
import { spawn } from 'child_process';
import {
  RUN_DETECTOR_SCRIPT,
  RUN_SUMMARIZER_SCRIPT,
  SCRIPTS_DIR,
} from '@/constants';

function spawnScript(
  projectCwd: string,
  scriptFileName: typeof RUN_DETECTOR_SCRIPT | typeof RUN_SUMMARIZER_SCRIPT,
): void {
  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];

  if (!pluginRoot) {
    return;
  }

  const scriptPath = join(pluginRoot, SCRIPTS_DIR, scriptFileName);
  const child = spawn(process.execPath, [scriptPath, projectCwd], {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}

export function spawnDetectorScript(cwd: string): void {
  spawnScript(cwd, RUN_DETECTOR_SCRIPT);
}

export function spawnSummarizerScript(cwd: string): void {
  spawnScript(cwd, RUN_SUMMARIZER_SCRIPT);
}
