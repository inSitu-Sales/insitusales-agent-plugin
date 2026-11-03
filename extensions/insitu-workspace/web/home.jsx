import React from 'react';
import { ArrowUpRight, CaretDown, ChartLineUp, GlobeHemisphereWest, Package, Receipt, ShoppingCart, Users } from '@phosphor-icons/react';

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
  return <main className="home">
    <div className="home-intro">
      <span className="home-eyebrow">AI FOR WHOLESALE DISTRIBUTION</span>
      <h1>Your wholesale business.<br className="home-mobile-break"/> One conversation.</h1>
      <p>Look up customer accounts, prepare orders and invoices, and check inventory.<br className="home-desktop-break"/> Improve your B2B eCommerce storefront—all through inSitu Sales.</p>
    </div>
    <section className="suggestions" aria-label="Things you can do with inSitu Sales">
      {suggestions.map(({ icon: Icon, ...suggestion }) => suggestion.prompts ? <details className={`suggestion-group ${suggestion.color}`} key={suggestion.title}>
        <summary className="suggestion">
          <span className="suggestion-icon"><Icon size={23} weight="regular"/></span>
          <span className="suggestion-copy"><strong>{suggestion.title}</strong><span>{suggestion.description}</span></span>
          <CaretDown className="suggestion-arrow" size={16}/>
        </summary>
        <div className="nested-prompts">
          {suggestion.prompts.map(item => <button key={item.title} type="button" className="nested-prompt" disabled={!ready || drafting} onClick={() => onChoose(item.prompt)}>
            <span className="suggestion-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
            <ArrowUpRight size={16} aria-hidden="true"/>
          </button>)}
        </div>
      </details> : <button key={suggestion.title} type="button" className={`suggestion ${suggestion.color}`} onClick={() => onChoose(suggestion.prompt)} disabled={!ready || drafting}>
        <span className="suggestion-icon"><Icon size={23} weight="regular"/></span>
        <span className="suggestion-copy"><strong>{suggestion.title}</strong><span>{suggestion.description}</span></span>
        <ArrowUpRight className="suggestion-arrow" size={16}/>
      </button>)}
    </section>
    <p className="home-hint">Choose an idea to add it to your chat input. Make it your own, then send.</p>
  </main>;
}
