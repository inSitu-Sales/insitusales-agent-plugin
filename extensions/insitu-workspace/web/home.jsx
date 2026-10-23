import React from 'react';
import { ArrowUpRight, ChartLineUp, GlobeHemisphereWest, Package, Receipt, ShoppingCart, Users } from '@phosphor-icons/react';

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
    title: 'Redesign your B2B eCommerce storefront', icon: GlobeHemisphereWest, color: 'rose',
    description: 'Create a B2B storefront or improve the one you have.',
    prompt: 'Help me create my B2B storefront with inSitu Sales. Guide me step by step and show me a preview',
  },
];

export function Home({ ready, drafting, status, onChoose }) {
  return <main className="home">
    <div className="home-intro">
      <span className="home-eyebrow">AI FOR WHOLESALE DISTRIBUTION</span>
      <h1>Your wholesale business.<br className="home-mobile-break"/> One conversation.</h1>
      <p>Look up customer accounts, prepare orders and invoices, and check inventory.<br className="home-desktop-break"/> Improve your B2B eCommerce storefront—all through inSitu Sales.</p>
    </div>
    <section className="suggestions" aria-label="Things you can do with inSitu Sales">
      {suggestions.map(({ icon: Icon, ...suggestion }) => <button key={suggestion.title} type="button" className={`suggestion ${suggestion.color}`} onClick={() => onChoose(suggestion.prompt)} disabled={!ready || drafting}>
        <span className="suggestion-icon"><Icon size={23} weight="regular"/></span>
        <span className="suggestion-copy"><strong>{suggestion.title}</strong><span>{suggestion.description}</span></span>
        <ArrowUpRight className="suggestion-arrow" size={16}/>
      </button>)}
    </section>
    <p className="home-hint">Choose an idea to add it to your chat input. Make it your own, then send.</p>
    {status && <p className="home-status" role="status">{status}</p>}
  </main>;
}
