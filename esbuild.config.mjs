import builtins from 'builtin-modules';
import esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import process from 'process';
import autoPreprocess from 'svelte-preprocess';

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the GitHub repository of this plugin.
*/
`;
const isProductionBuild = process.argv[2] === 'production';
const isWatch = process.argv[2] === 'watch';
const context = await esbuild.context({
  banner: {
    js: banner
  },
  outdir: 'dist',
  entryPoints: ['src/main.ts'],
  bundle: true,
  mainFields: ['module', 'main'],
  format: 'cjs',
  target: 'es2018',
  logLevel: isProductionBuild ? 'info' : 'debug',
  sourcemap: isProductionBuild ? false : 'inline',
  treeShaking: true,
  minify: isProductionBuild,
  plugins: [
    sveltePlugin({
      preprocess: autoPreprocess(),
      compilerOptions: { css: 'injected' }
    })
  ],
  external: [
    'obsidian',
    'electron',
    'moment',
    '@codemirror/autocomplete',
    '@codemirror/closebrackets',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/comment',
    '@codemirror/fold',
    '@codemirror/gutter',
    '@codemirror/highlight',
    '@codemirror/history',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/matchbrackets',
    '@codemirror/panel',
    '@codemirror/rangeset',
    '@codemirror/rectangular-selection',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/stream-parser',
    '@codemirror/text',
    '@codemirror/tooltip',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins
  ]
});

context
  .rebuild()
  .then(() => {
    console.log("Production build. Generated output: 'main.js'");
  })
  .catch(() => {
    console.log('Build failed!');
    process.exit(1);
  })
  .finally(() => {
    if (isWatch) {
      context.watch();
    }
    process.exit(0);
  });
