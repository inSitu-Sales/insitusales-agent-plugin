import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const result = await build({
  entryPoints:[fileURLToPath(new URL('../web/home.jsx', import.meta.url))],
  bundle:true, write:false, platform:'node', format:'esm', jsx:'automatic',
  plugins:[{name:'shared-react',setup(build){
    build.onResolve({filter:/^react(?:\/.*)?$/}, args=>({path:pathToFileURL(require.resolve(args.path)).href,external:true}));
  }}],
});
const {Home} = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

test('B2B offers exactly two prompts in an initially closed, labelled native dialog', () => {
  const html = renderToStaticMarkup(React.createElement(Home,{ready:true,drafting:false,onChoose(){}}));
  assert.match(html, /aria-haspopup="dialog"/);
  const dialog = html.match(/<dialog\b([^>]*)>([\s\S]*?)<\/dialog>/);
  assert.ok(dialog, 'The B2B selector must be a native dialog');
  assert.match(dialog[1], /aria-labelledby="b2b-prompt-title"/);
  assert.match(dialog[1], /aria-describedby="b2b-prompt-description"/);
  assert.doesNotMatch(dialog[1], /\bopen(?:=|\s|$)/);
  assert.equal((dialog[2].match(/class="prompt-option"/g)||[]).length,2);
  assert.match(dialog[2], /Create a B2B portal/);
  assert.match(dialog[2], /Send the project ZIP/);
  assert.match(dialog[2], /aria-label="Close B2B prompts"/);
  assert.doesNotMatch(html, /<details\b/);
});

test('B2B prompt choices remain disabled until the host is ready or while drafting', () => {
  for(const props of [{ready:false,drafting:false},{ready:true,drafting:true}]) {
    const html = renderToStaticMarkup(React.createElement(Home,{...props,onChoose(){}}));
    const options = [...html.matchAll(/<button\b[^>]*class="prompt-option"[^>]*>/g)];
    assert.equal(options.length,2);
    for(const [button] of options) assert.match(button,/disabled=""/);
  }
});
