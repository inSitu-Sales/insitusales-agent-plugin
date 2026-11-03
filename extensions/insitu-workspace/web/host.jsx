import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
import { applyDocumentTheme, McpUiMessageRequestSchema } from '@modelcontextprotocol/ext-apps';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { OpenAIMessageParamsSchema } from '@openai/mcp-extensions/app';
import { ArrowUp } from '@phosphor-icons/react';

function PromptPreview() {
  const [theme, setTheme] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const frame = useRef(null);
  const bridge = useRef(null);
  const composer = useRef(null);
  useEffect(() => {
    const host = new AppBridge(null, { name: 'inSitu prompt directory preview', version: '0.4.1' }, { message: {}, experimental: { 'openai/message': {} } }, { hostContext: { theme, displayMode: 'inline' } });
    bridge.current = host;
    host.setRequestHandler(McpUiMessageRequestSchema.extend({ params: OpenAIMessageParamsSchema }), async ({ params: { content, _meta } }) => {
      const text = content.filter(block => block.type === 'text').map(block => block.text).join('\n');
      if (_meta?.['openai/message']?.send !== false) throw new Error('The prompt directory must never submit a message.');
      setInput(previous => previous ? `${previous}\n\n${text}` : text);
      composer.current?.focus();
      return {};
    });
    host.setRequestHandler(CallToolRequestSchema, async () => { throw new Error('The prompt directory must never call a business tool.'); });
    host.oninitialized = async () => {
      await host.sendToolInput({ arguments: {} });
      await host.sendToolResult({content:[], structuredContent:{kind:'openInsituWorkspace', data:null}});
    };
    host.connect(new PostMessageTransport(frame.current.contentWindow, frame.current.contentWindow));
    frame.current.src = '/widget';
    return () => { host.close(); };
  }, []);
  useEffect(() => { applyDocumentTheme(theme); bridge.current?.setHostContext({theme}); }, [theme]);
  return <>
    <div className="demo-theme"><span>Local host simulator</span><button type="button" onClick={() => setTheme(previous => previous === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</button></div>
    <div className="chat-preview"><section className="conversation">
      <header><div><img src="__INSITU_LOGO__" alt=""/><strong>inSitu Sales</strong></div><span>Prompt directory preview</span></header>
      <main>{messages.map((message, index) => <div key={index} className="message user"><p>{message}</p></div>)}</main>
      <form onSubmit={event => { event.preventDefault(); if (input.trim()) { setMessages(previous => [...previous, input.trim()]); setInput(''); } }}>
        <label htmlFor="chat-input" hidden>Message inSitu Sales</label><textarea ref={composer} id="chat-input" rows={3} value={input} onChange={event => setInput(event.target.value)} placeholder="Choose a prompt, edit it here, then send…"/>
        <button aria-label="Send message" type="submit" disabled={!input.trim()}><ArrowUp size={20}/></button>
      </form><p className="sample-note">Local preview · no connected business tools</p>
    </section><section className="preview-pane"><iframe ref={frame} title="inSitu prompt directory"/></section></div>
  </>;
}
createRoot(document.getElementById('root')).render(<PromptPreview/>);
