import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';
import { OpenAIExtensions } from '@openai/mcp-extensions/app';
import { ArrowUpRight, Desktop, DeviceMobile, MagnifyingGlass } from '@phosphor-icons/react';
import { money, safePreviewUrl } from './model.mjs';
import { draftNativePrompt } from './chat.mjs';
import { Home } from './home.jsx';
import contract from '../server/workspace.cjs';

const app = new App({ name: 'inSitu Sales', version: '0.4.1' }, { availableDisplayModes: ['inline', 'fullscreen'] });
const extensions = new OpenAIExtensions(app);
function applyTheme(context) {
  if (context?.theme) applyDocumentTheme(context.theme);
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
}
function WebsitePreview() {
  const [plan, setPlan] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let company;
    app.ontoolresult = (result) => {
      const state = result?.structuredContent;
      if (!state || result.isError) return;
      if (company !== JSON.stringify(state.scope)) { setPlan(null); setQuery(''); setCategory(''); company = JSON.stringify(state.scope); }
      if (state.kind !== 'renderInsituPortalPlan') return;
      try { contract.validatePayload(state.kind, state.data); setPlan(state.data); setError(''); }
      catch { setError('This preview could not be displayed. Continue in the conversation.'); }
    };
    app.addEventListener('hostcontextchanged', applyTheme);
    if (window.parent !== window) app.connect().then(() => { applyTheme(app.getHostContext()); setReady(true); }).catch(() => setError('Open inSitu Sales from your installed plugin.'));
    return () => { app.ontoolresult = undefined; app.removeEventListener('hostcontextchanged', applyTheme); };
  }, []);
  const catalog = plan?.preview;
  const products = catalog?.products.filter((product) => (!category || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())) || [];
  const sample = plan?.source.label.includes('Sample data');
  const builtUrl = safePreviewUrl(plan?.previewUrl);
  async function chooseSuggestion(prompt) {
    if (drafting || !ready) return;
    setDrafting(true); setError(''); setStatus('');
    try {
      await draftNativePrompt(extensions, prompt);
      setStatus('Added to your chat input. Edit it there, then send.');
    } catch (error) { setError(error.message || 'Check your chat input before trying again.'); }
    finally { setDrafting(false); }
  }
  async function review() {
    const message = `Review the website changes for ${plan.hostname || 'this new storefront'} before publishing. ${plan.artifact ? `The prepared ZIP has SHA-256 ${plan.artifact.sha256} and size ${plan.artifact.sizeBytes} bytes.` : 'Prepare a working build and show me its preview first.'} This is a review request, not publication approval.`;
    try { const result = await app.sendMessage({ role: 'user', content: [{ type: 'text', text: message }] }); if (result.isError) throw new Error(); }
    catch { setError('Continue the review in your conversation. Delivery could not be confirmed.'); }
  }
  return <div className="website-panel"><header className="preview-header"><div><img src="__INSITU_LOGO__" alt=""/><strong>inSitu Sales</strong></div>{plan && <div className="device-switch" aria-label="Preview size"><button aria-label="Desktop preview" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}><Desktop size={19}/></button><button aria-label="Mobile preview" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}><DeviceMobile size={19}/></button></div>}{!plan && <span className="home-header-label">Your AI workspace</span>}</header>{!plan ? <Home ready={ready} drafting={drafting} status={status} onChoose={chooseSuggestion}/> : <><div className="preview-caption"><span>{plan.hostname || 'Storefront address not configured'}</span><span>{sample ? 'Sample layout' : builtUrl ? 'Build available' : 'Proposed layout'} · Not published</span></div><main className={`site-stage ${device}`}><div className={`site-preview ${catalog?.style || 'light'}`}>{catalog ? <><div className="site-header"><strong>{catalog.companyName}</strong><span>Wholesale, made simple.</span></div><div className="site-intro"><span className="eyebrow">YOUR EVERYDAY ESSENTIALS</span><h1>Good products.<br/>Easy ordering.</h1><p>Find what you need and get back to your business.</p></div><div className="search"><MagnifyingGlass size={19}/><label className="sr-only" htmlFor="catalog-search">Search preview products</label><input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the catalog"/></div><nav aria-label="Product categories"><button aria-pressed={!category} onClick={() => setCategory('')}>All products</button>{catalog.categories.map((name) => <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</nav><section className="catalog"><h2>{category || 'Shop the catalog'}</h2><div className="product-grid">{products.map((product) => <article key={product.id}><small>{product.category}</small><h3>{product.name}</h3><span>{product.pack}</span><strong>{money(product.price, catalog.currency)} <small>/ case</small></strong></article>)}</div>{!products.length && <p>No products match your search.</p>}</section><footer>{catalog.companyName}<span>Illustrative layout · no checkout</span></footer></> : <div className="empty"><h1>{plan.title}</h1><p>Continue in the conversation to build and preview the website.</p></div>}</div></main><div className="preview-footer"><span>Keep refining it in the chat.</span><div>{builtUrl && <button className="text-button" onClick={() => app.openLink({ url: builtUrl }).catch(() => setError('The host could not open the built preview.'))}>Open built preview <ArrowUpRight size={15}/></button>}{(plan.artifact || builtUrl) && <button className="review-button" onClick={review}>Review changes</button>}</div></div></>}{error && <p className="error" role="status">{error}</p>}</div>;
}
createRoot(document.getElementById('root')).render(<WebsitePreview/>);
