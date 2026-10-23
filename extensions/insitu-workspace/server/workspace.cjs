'use strict';
const BRAND_ICON = require('./workspace-brand.cjs');
const RESOURCE_URI = 'ui://insitu/website/v9.html';
const TOOL_NAME = 'openInsituWorkspace';
const VIEWS = ['portal'];
const text = (maxLength = 300) => ({ type: 'string', minLength: 1, maxLength });
const number = { type: 'number', minimum: 0, maximum: 1e12 };
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const array = (items, maxItems = 100) => ({ type: 'array', items, maxItems });
const choice = (values) => ({ type: 'string', enum: values });
const currency = { type: 'string', pattern: '^[A-Z]{3}$' };
const provenance = object({ label: text(300), coverage: choice(['complete', 'partial', 'unknown']), asOf: text(60) });
const product = object({ id: text(80), name: text(180), pack: text(80), price: number, category: text(80) });
const schemas = {
  openInsituWorkspace: object({ view: choice(VIEWS) }, []),
  renderInsituPortalPlan: object({ title: text(180), hostname: text(253), mode: choice(['create', 'improve']), changes: array(text(300), 20), preview: object({ companyName: text(180), currency, categories: array(text(80), 20), products: array(product, 40), style: choice(['light', 'dark', 'compact']) }, ['companyName', 'currency', 'categories', 'products']), previewUrl: text(2000), artifact: object({ sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' }, sizeBytes: { type: 'integer', minimum: 1, maximum: 1e9 } }), source: provenance }, ['title', 'hostname', 'mode', 'changes', 'source']),
};
const descriptions = {
  openInsituWorkspace: 'Use this when the user asks to open inSitu Sales or create or redesign their B2B website. Launch the inSitu Sales home page with suggested prompts for customers, orders, invoices, sales insights, catalog lookup and website redesign, or open its preview beside the conversation. Selecting a card adds a suggestion to the native chat composer without sending. The user edits and sends it there. The app has no custom chat input. This does not build or publish the site.',
  renderInsituPortalPlan: 'Use this when creating or improving a B2B portal, after following the storefront-authoring skill and checking permissions. Show proposed changes and optional illustrative catalog layout or actual HTTPS preview link. A layout is not a built storefront. Supply artifact SHA-256 and size only from a prepared ZIP. This does not build, upload or publish files. Local execution is required unless a hosted authoring service is available.',
};
function validate(schema, value, path = 'input') {
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path}: unsupported value`);
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected object`);
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key}: required`);
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties, key)) throw new Error(`${path}.${key}: unexpected field`);
      validate(schema.properties[key], value[key], `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length > schema.maxItems || value.length < (schema.minItems || 0)) throw new Error(`${path}: invalid list length`);
    value.forEach((entry, i) => validate(schema.items, entry, `${path}[${i}]`));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string' || value.length < (schema.minLength || 0) || value.length > (schema.maxLength || Infinity) || (schema.pattern && !new RegExp(schema.pattern).test(value))) throw new Error(`${path}: invalid text`);
  } else if (schema.type === 'number' || schema.type === 'integer') {
    if (typeof value !== 'number' || !Number.isFinite(value) || (schema.type === 'integer' && !Number.isInteger(value)) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity) || (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum)) throw new Error(`${path}: invalid number`);
  }
}
function validatePayload(name, args) {
  if (!Object.hasOwn(schemas, name)) throw new Error('Unknown workspace tool');
  validate(schemas[name], args);
  if (args.currency) { try { new Intl.NumberFormat('en', { style: 'currency', currency: args.currency }).format(1); } catch { throw new Error('Invalid currency'); } }
  if (name === 'renderInsituPortalPlan') {
    if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(args.hostname)) throw new Error('Use a storefront hostname without a path');
    if (args.previewUrl) { const url = new URL(args.previewUrl); if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Preview link must use HTTPS without credentials'); }
  }
  return args;
}
function createWorkspaceExtension(html, options = {}) {
  if (typeof html !== 'string' || !html.includes('<!doctype html>')) throw new Error('Build the inSitu workspace HTML before enabling the extension.');
  const scope = { companyId: options.companyId == null ? null : String(options.companyId) };
  const resource = { uri: RESOURCE_URI, name: 'insitu-sales-workspace', title: 'inSitu Sales', mimeType: 'text/html;profile=mcp-app' };
  const enabledNames = [TOOL_NAME, 'renderInsituPortalPlan'];
  const tools = Object.entries(schemas).filter(([name]) => enabledNames.includes(name)).map(([name, inputSchema]) => ({ name, title: name === TOOL_NAME ? 'inSitu Sales' : 'Preview website changes', icons: [BRAND_ICON], description: descriptions[name], inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true }, _meta: { ui: { resourceUri: RESOURCE_URI }, ...(name === TOOL_NAME ? { 'openai/ui': { entrypoints: [{ type: 'global' }, { type: 'thread' }] } } : {}) } }));
  return {
    tools, tool: tools[0], resource,
    handles: (name) => enabledNames.includes(name),
    call(name, args = {}) {
      try {
        if (!enabledNames.includes(name)) throw new Error('This extension only displays website previews. Use the existing business tools in chat.');
        validatePayload(name, args);
        const view = name === TOOL_NAME ? args.view ?? 'portal' : 'portal';
        return { content: [{ type: 'text', text: name === TOOL_NAME ? 'Opened inSitu Sales. Continue in the native chat and populate the website preview with renderInsituPortalPlan when redesigning a website.' : 'Displayed the supplied inSitu Sales result. This render tool did not change any business records.' }], structuredContent: { view, scope, kind: name, data: name === TOOL_NAME ? null : args } };
      } catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
    },
    read(uri) { if (uri !== RESOURCE_URI) throw new Error('Unknown workspace resource'); return { contents: [{ ...resource, text: html, _meta: { ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } }, 'openai/ui': { availableDisplayModes: ['inline', 'fullscreen'] } } }] }; }
  };
}
module.exports = { createWorkspaceExtension, RESOURCE_URI, TOOL_NAME, BRAND_ICON, schemas, validatePayload };
