import React, { useRef } from 'react';
import { ArrowUpRight, CaretRight, X, ChartLineUp, GlobeHemisphereWest, Package, Receipt, ShoppingCart, Users } from '@phosphor-icons/react';

const suggestions = [
  {
    title: 'Know your customers', icon: Users, color: 'blue',
    description: 'Find a customer and get the full picture of their account.',
    prompt: 'Help me find a customer and summarize their account, recent orders, and invoices. Ask me which customer to look up first.',
  },
  {
    title: 'Prepare a sales order', icon: ShoppingCart, color: 'green',
    description: 'Turn a customer request into an order ready to review.',
    prompt: 'Help me prepare a sales order. Ask me for the customer and products, check current prices and availability, and show me the details before creating the order.',
  },
  {
    title: 'Draft an invoice', icon: Receipt, color: 'amber',
    description: 'Put together an invoice with the right customer and items.',
    prompt: 'Help me prepare an invoice. Ask me for the customer and items or existing sales order, verify the details, and show me the draft before creating it.',
  },
  {
    title: 'Understand your sales', icon: ChartLineUp, color: 'violet',
    description: 'Explore sales trends, top products, and customer activity.',
    prompt: 'Help me understand my sales performance. Ask me which period to review, then summarize sales trends, top products, and customer activity using the available inSitu data. Explain any gaps in coverage.',
  },
  {
    title: 'Explore your catalog', icon: Package, color: 'teal',
    description: 'Look up products, pricing, and available inventory.',
    prompt: 'Help me find products and check their current prices and available inventory. Ask me which products or category to look up and which customer or warehouse applies.',
  },
  {
    title: 'Your B2B eCommerce storefront', icon: GlobeHemisphereWest, color: 'rose',
    description: 'Create your portal or send a ZIP for publication.',
    prompts: [
      {
        title: 'Create a B2B portal',
        description: 'Describe your store and build it with the assistant.',
        prompt: 'Help me create my B2B portal with inSitu Sales. Guide me step by step, ask for the requirements you need, and show me a working preview. Do not publish until I ask you to.',
      },
      {
        title: 'Send the project ZIP',
        description: 'Ask the assistant to send your storefront ZIP.',
        prompt: 'Help me send my B2B storefront ZIP for publication with inSitu Sales. Use the ZIP from this conversation, or ask me to attach it or provide its location. Verify the artifact and the destination for my authenticated company, then publish it. Explain the result and any errors in this chat.',
      },
    ],
  },
];

export function Home({ ready, drafting, onChoose }) {
  const dialog = useRef(null);
  const storefront = suggestions.find(suggestion => suggestion.prompts);
  function choosePrompt(prompt) {
    dialog.current.close();
    onChoose(prompt);
  }
  function closeFromBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      event.currentTarget.close();
    }
  }
  return <main className="home">
    <div className="home-intro">
      <span className="home-eyebrow">AI FOR WHOLESALE DISTRIBUTION</span>
      <h1>Your wholesale business.<br className="home-mobile-break"/> One conversation.</h1>
      <p>Look up customer accounts, prepare orders and invoices, and check inventory.<br className="home-desktop-break"/> Improve your B2B eCommerce storefront—all through inSitu Sales.</p>
    </div>
    <section className="suggestions" aria-label="Things you can do with inSitu Sales">
      {suggestions.map(({ icon: Icon, ...suggestion }) => <button key={suggestion.title} type="button" className={`suggestion ${suggestion.color}`} aria-haspopup={suggestion.prompts ? 'dialog' : undefined} onClick={() => suggestion.prompts ? dialog.current.showModal() : onChoose(suggestion.prompt)} disabled={!suggestion.prompts && (!ready || drafting)}>
        <span className="suggestion-icon"><Icon size={23} weight="regular"/></span>
        <span className="suggestion-copy"><strong>{suggestion.title}</strong><span>{suggestion.description}</span></span>
        {suggestion.prompts ? <CaretRight className="suggestion-arrow" size={16} aria-hidden="true"/> : <ArrowUpRight className="suggestion-arrow" size={16} aria-hidden="true"/>}
      </button>)}
    </section>
    <dialog ref={dialog} className="prompt-dialog" aria-labelledby="b2b-prompt-title" aria-describedby="b2b-prompt-description" onClick={closeFromBackdrop}>
      <header className="prompt-dialog-header">
        <div><span className="home-eyebrow">INSITU SALES</span><h2 id="b2b-prompt-title">B2B eCommerce</h2></div>
        <button type="button" className="dialog-close" aria-label="Close B2B prompts" onClick={() => dialog.current.close()}><X size={20} aria-hidden="true"/></button>
      </header>
      <p id="b2b-prompt-description">Choose an option to add its prompt to your chat.</p>
      <div className="prompt-options">
        {storefront.prompts.map(item => <button key={item.title} type="button" className="prompt-option" disabled={!ready || drafting} onClick={() => choosePrompt(item.prompt)}>
          <span className="suggestion-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
          <ArrowUpRight size={18} aria-hidden="true"/>
        </button>)}
      </div>
    </dialog>
    <p className="home-hint">Choose an idea to add it to your chat input. Make it your own, then send.</p>
  </main>;
}
