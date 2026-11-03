import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';
import { OpenAIExtensions } from '@openai/mcp-extensions/app';
import { draftNativePrompt } from './chat.mjs';
import { Home } from './home.jsx';

const app = new App({ name: 'inSitu Sales', version: '0.4.1' }, { availableDisplayModes: ['inline', 'fullscreen'] });
const extensions = new OpenAIExtensions(app);
function applyTheme(context) {
  if (context?.theme) applyDocumentTheme(context.theme);
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
}
function PromptDirectory() {
  const [ready, setReady] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    app.addEventListener('hostcontextchanged', applyTheme);
    if (window.parent !== window) app.connect().then(() => {
      applyTheme(app.getHostContext());
      setReady(true);
    }).catch(() => setError('Open inSitu Sales from your installed plugin.'));
    return () => app.removeEventListener('hostcontextchanged', applyTheme);
  }, []);
  async function chooseSuggestion(prompt) {
    if (drafting || !ready) return;
    setDrafting(true); setError('');
    try {
      await draftNativePrompt(extensions, prompt);
    } catch (error) { setError(error.message || 'Check your chat input before trying again.'); }
    finally { setDrafting(false); }
  }
  return <div className="website-panel">
    <header className="preview-header"><div><img src="__INSITU_LOGO__" alt=""/><strong>inSitu Sales</strong></div><span className="home-header-label">Prompt directory</span></header>
    <Home ready={ready} drafting={drafting} onChoose={chooseSuggestion}/>
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
createRoot(document.getElementById('root')).render(<PromptDirectory/>);
