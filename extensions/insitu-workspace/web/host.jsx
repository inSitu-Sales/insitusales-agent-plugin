import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
import { applyDocumentTheme, McpUiMessageRequestSchema } from '@modelcontextprotocol/ext-apps';
import { OpenAIMessageParamsSchema } from '@openai/mcp-extensions/app';
import { ArrowUp } from '@phosphor-icons/react';
import { fixtures } from './fixtures.mjs';

function ChatPreview() {
  const sidebar = window.location.pathname === '/sidebar';
  const [theme, setTheme] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [started, setStarted] = useState(false);
  const frame = useRef(null);
  const bridge = useRef(null);
  const composer = useRef(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(sidebar ? [] : [
    { role: 'user', text: 'Help me redesign our B2B website. Make it simpler and easier to shop.' },
    { role: 'assistant', text: 'Let’s start with a cleaner catalog. The sample preview is beside our chat. Tell me what you’d like to change next.' }
  ]);
  const plan = useRef(structuredClone(fixtures.portal));
  async function render() { await bridge.current.sendToolResult({ content: [{ type: 'text', text: 'Sample website layout' }], structuredContent: { view: 'portal', scope: { companyId: 'demo' }, kind: 'renderInsituPortalPlan', data: plan.current } }); }
  async function respond(text) {
    setStarted(true);
    setMessages((previous) => [...previous, { role: 'user', text }]);
    const lower = text.toLowerCase();
    if (/^(publish|review the website changes)/.test(lower) && /website|storefront|layout/.test(lower)) { setMessages((previous) => [...previous, { role: 'assistant', text: 'This is a sample layout, so there is no built website to publish yet. In a connected conversation, we would build it, review the result, and get your approval first.' }]); return {}; }
    if (!/website|storefront|layout|dark|compact|light/.test(lower)) { setMessages((previous) => [...previous, { role: 'assistant', text: 'Your request reached the conversation. This local simulator has no real company data. With the connected inSitu Sales plugin, the assistant can use your account’s available tools to help with this request.' }]); return {}; }
    const style = /dark/.test(lower) ? 'dark' : /compact/.test(lower) ? 'compact' : 'light';
    plan.current = { ...plan.current, preview: { ...plan.current.preview, style } };
    await render();
    setMessages((previous) => [...previous, { role: 'assistant', text: `I switched the sample to a ${style} layout. This local preview demonstrates the conversation flow; the connected assistant handles the actual website redesign.` }]);
    return {};
  }
  useEffect(() => {
    const host = new AppBridge(null, { name: 'inSitu chat preview', version: '0.4.1' }, { message: {}, openLinks: {}, experimental: { 'openai/message': {} } }, { hostContext: { theme, displayMode: sidebar ? 'fullscreen' : 'inline' } });
    bridge.current = host;
    // The base AppBridge message schema strips extension metadata. Preserve
    // OpenAI's draft options so this simulator exercises the native contract.
    host.setRequestHandler(McpUiMessageRequestSchema.extend({ params: OpenAIMessageParamsSchema }), async ({ params: { content, _meta } }) => {
      const text = content.filter((block) => block.type === 'text').map((block) => block.text).join('\n');
      if (_meta?.['openai/message']?.send === false) {
        setStarted(true);
        setInput((previous) => previous ? `${previous}\n\n${text}` : text);
        composer.current?.focus();
        return {};
      }
      return respond(text);
    });
    host.onopenlink = async () => ({ isError: true });
    host.oninitialized = async () => { await host.sendToolInput({ arguments: { view: 'portal' } }); if (!sidebar) await render(); setReady(true); };
    host.connect(new PostMessageTransport(frame.current.contentWindow, frame.current.contentWindow));
    frame.current.src = '/widget';
    return () => { host.close(); };
  }, []);
  useEffect(() => { applyDocumentTheme(theme); bridge.current?.setHostContext({ theme }); }, [theme]);
  useEffect(() => { if (started) composer.current?.focus(); }, [started]);
  return <><div className="demo-theme"><span>Local host simulator</span><button type="button" onClick={() => setTheme((previous) => previous === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</button></div><div className={`chat-preview ${sidebar && !started ? 'sidebar-launch' : ''}`}><section className="conversation"><header><div><img src="__INSITU_LOGO__" alt=""/><strong>inSitu Sales</strong></div><span>Local extension simulator</span></header><main>{messages.map((message, index) => <div key={index} className={`message ${message.role}`}>{message.role === 'assistant' && <small>inSitu Sales</small>}<p>{message.text}</p></div>)}</main><form onSubmit={(event) => { event.preventDefault(); if (input.trim()) { respond(input.trim()); setInput(''); } }}><label className="sr-only" htmlFor="chat-input">Message inSitu Sales</label><textarea ref={composer} id="chat-input" rows={2} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask anything, or describe a website change…"/><button aria-label="Send message" type="submit" disabled={!ready || !input.trim()}><ArrowUp size={20}/></button></form><p className="sample-note">Local demo · sample data · try “make it dark”</p></section><section className="preview-pane"><iframe ref={frame} title="Website preview"/></section></div></>;
}
createRoot(document.getElementById('root')).render(<ChatPreview/>);
