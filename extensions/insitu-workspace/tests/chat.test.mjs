import test from 'node:test';
import assert from 'node:assert/strict';
import { draftNativePrompt } from '../web/chat.mjs';

test('a card appends an editable draft to the native composer without submitting it', async () => {
  let received;
  await draftNativePrompt({ message: { send: async (message) => { received = message; return {}; } } }, ' Redesign my website ');
  assert.deepEqual(received._meta['openai/message'], { target: 'active', send: false });
  assert.equal(received.content[0].text, 'Redesign my website');
});

test('hosts without native draft support never fall back to submitting the prompt', async () => {
  let sent = false;
  await assert.rejects(draftNativePrompt({ sendMessage: async () => { sent = true; return {}; } }, 'Hello'), /regular chat input/);
  assert.equal(sent, false);
});

test('draft errors and invalid suggestions are reported without retrying', async () => {
  let attempts = 0;
  await assert.rejects(draftNativePrompt({ message: { send: async () => { attempts++; return { isError: true }; } } }, 'Hello'), /could not be added/);
  assert.equal(attempts, 1);
  await assert.rejects(draftNativePrompt({}, '   '), /Enter a message/);
});
