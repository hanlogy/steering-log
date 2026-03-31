import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const aliasPlugin = {
  name: 'path-alias',
  setup(build) {
    build.onResolve({ filter: /^@\// }, async (args) => {
      return build.resolve(args.path.replace(/^@\//, './'), {
        resolveDir: resolve(__dirname, 'src'),
        kind: args.kind,
      });
    });
  },
};

await esbuild.build({
  entryPoints: [
    'src/scripts/appendToBuffer.ts',
    'src/scripts/cleanup.ts',
    'src/scripts/runDetector.ts',
    'src/scripts/runSummarizer.ts',
  ],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'scripts',
  plugins: [aliasPlugin],
});
