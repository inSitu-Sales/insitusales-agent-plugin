import React, { useRef, useState } from 'react';
import { safePreviewUrl } from './model.mjs';

export function Publication({ initial, app }) {
  const [result, setResult] = useState(initial);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const submitted = useRef(false);
  const ready = result.status === 'ready';
  const active = result.status === 'active';
  const hostname = result.hostname || initial.hostname;
  const url = active && hostname ? safePreviewUrl(`https://${hostname}`) : null;
  async function send() {
    if (!ready || submitted.current) return;
    submitted.current = true;
    setPending(true);
    try {
      const response = await app.callServerTool({ name: 'confirmStorefrontRelease', arguments: { artifactId: initial.artifactId } }, { timeout: 180000 });
      if (response?.structuredContent?.kind !== 'storefrontPublication') throw new Error('Missing publication result');
      setResult(response.structuredContent);
    } catch {
      setResult({ outcome: 'unknown', message: 'The publication result could not be confirmed. Your website may have changed.', nextAction: 'Do not send the ZIP again. Contact inSitu Sales support to verify this attempt.' });
    } finally { setPending(false); }
  }
  async function copyDetails() {
    const fields = { artifactId: initial.artifactId, hostname, digest: initial.digest, size: initial.size, status: result.status, outcome: result.outcome, code: result.code, stage: result.stage, httpStatus: result.httpStatus, requestId: result.requestId, attemptId: result.attemptId, message: result.message, nextAction: result.nextAction };
    try { await navigator.clipboard.writeText(JSON.stringify(fields, null, 2)); setNotice('Support details copied.'); }
    catch { setNotice('Clipboard unavailable. Select the details below to copy them.'); }
  }
  return <section className="publication-panel" aria-label="ZIP publication">
    <p className="publication-eyebrow">B2B ECOMMERCE</p><h1>{pending ? 'Sending ZIP…' : active ? 'Publication confirmed' : ready ? 'Send your storefront ZIP' : result.status === 'prepared' ? 'ZIP prepared' : 'Publication needs attention'}</h1>
    <dl><dt>ZIP</dt><dd>{initial.filename || 'Prepared storefront ZIP'}</dd>{initial.size && <><dt>Size</dt><dd>{initial.size.toLocaleString()} bytes</dd></>}{hostname && <><dt>Destination</dt><dd>{hostname}</dd></>}</dl>
    <div role="status" aria-live="polite"><p>{pending ? 'Waiting for the publication service to respond. Keep this panel open. Do not start another upload.' : result.message}</p>{!pending && result.nextAction && <p>{result.nextAction}</p>}</div>
    {ready && <><p>This replaces the storefront at the destination shown above.</p><button className="review-button" disabled={pending || submitted.current} onClick={send}>{pending ? 'Sending ZIP…' : 'Send ZIP'}</button></>}
    {result.status === 'prepared' && <p>Continue in the chat to review the destination and authorize this exact ZIP.</p>}
    {url && <button className="review-button" onClick={() => app.openLink({url}).then(response => { if (response?.isError) throw new Error('Link rejected'); }).catch(() => setNotice('The address could not be opened. Copy the destination above.'))}>Open storefront</button>}
    {!ready && result.status !== 'prepared' && <button className="text-button" onClick={copyDetails}>Copy support details</button>}
    <details><summary>Details for support</summary><dl>{Object.entries({ 'ZIP SHA-256': initial.digest, 'Artifact reference': initial.artifactId, 'Request reference': result.requestId, 'Attempt reference': result.attemptId, 'Failure stage': result.stage, 'Error code': result.code, 'HTTP status': result.httpStatus }).filter(([,v]) => v != null).map(([label,value]) => <React.Fragment key={label}><dt>{label}</dt><dd>{String(value)}</dd></React.Fragment>)}</dl></details>
    <p role="status">{notice}</p>
  </section>;
}
