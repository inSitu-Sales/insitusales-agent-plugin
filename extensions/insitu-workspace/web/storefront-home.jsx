import React, { useState } from 'react';
import { SavedProjects } from './saved-projects.jsx';

export const publicationPrompt = 'Publish my current B2B storefront project. Use the insitu-storefront-authoring skill and listStorefrontProjects to locate and verify its folder and authenticated company. If the project is ambiguous or unavailable, ask me to identify the local folder. Prepare the ZIP with prepareStorefrontRelease, authorize it with authorizeStorefrontUpload, and upload with publishStorefrontRelease. This is my approval to publish this project to its authenticated company storefront. Report the result in this chat without opening another panel or asking for approval again unless the destination or scope changes.';

export function StorefrontHome({ ready, drafting, status, onChoose, onBack, app, revision }) {
  const [resuming, setResuming] = useState(false);
  return <main className="home storefront-home">
    <button className="text-button" onClick={onBack}>← Back to workspace</button>
    <SavedProjects app={app} ready={ready} drafting={drafting} onChoose={onChoose} revision={revision} emptyContent={<>
    <div className="home-intro">
      <span className="home-eyebrow">B2B ECOMMERCE</span>
      <h1>Your storefront.<br/>From an idea to a published store.</h1>
      <p>Create your storefront with the chat. When the design is ready, ask the assistant to publish it.</p>
    </div>
    <ol className="storefront-steps">
      <li><span>01</span><h2>Design in the chat</h2><p>Describe your store, explore the preview, and refine it at your own pace.</p></li>
      <li><span>02</span><h2>Publish from the chat</h2><p>Ask to publish your current project. The assistant checks your files and uploads the storefront.</p></li>
      <li><span>03</span><h2>See the result</h2><p>Open your published store or get a clear explanation and next step if publication fails.</p></li>
    </ol>
    <div className="storefront-actions">
      <button className="review-button" disabled={!ready || drafting} onClick={() => onChoose('Help me create my B2B storefront with inSitu Sales. Guide me step by step and show me a preview. Do not publish until I ask you to publish.')}>Create my storefront</button>
      <button className="text-button" aria-expanded={resuming} onClick={() => setResuming(!resuming)}>I already started a design</button>
    </div>
    {resuming && <section className="storefront-resume">
      <h2>Continue where you designed it</h2>
      <p>Open the original chat to keep its design context. If you use this chat instead, provide your project folder or ZIP so the assistant can check the files.</p>
      <p>Saved projects above can be used in this chat. Earlier chat history is not restored automatically.</p>
    </section>}
    </>}/>
    {status && <p className="home-status" role="status">{status}</p>}
  </main>;
}
