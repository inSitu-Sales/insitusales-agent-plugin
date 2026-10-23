// On desktop the global entrypoint has its own host conversation. Thread panels
// use their current conversation. Never infer a new chat from fullscreen mode:
// both entrypoint types can be fullscreen.
export async function draftNativePrompt(extensions, text) {
  const prompt = text.trim();
  if (!prompt || prompt.length > 8000) throw new Error('Enter a message of up to 8,000 characters.');
  const message = { role: 'user', content: [{ type: 'text', text: prompt }] };
  if (!extensions.message) throw new Error('This app cannot add a suggestion to your chat input here. Type your request in the regular chat input.');
  const result = await extensions.message.send({ ...message, _meta: { 'openai/message': { target: 'active', send: false } } });
  if (result?.isError) throw new Error('The suggestion could not be added. Check your regular chat input before trying again.');
}
