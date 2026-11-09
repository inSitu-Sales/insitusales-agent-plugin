'use strict';
const BRAND_ICON = require('./workspace-brand.cjs');
const RESOURCE_URI = 'ui://insitu/prompts/v1.html';
const TOOL_NAME = 'openInSituWorkspace';
const schemas = {
  openInSituWorkspace: {
    type: 'object',
    properties: { view: { type: 'string', enum: ['portal'] } },
    additionalProperties: false,
  },
};
const description = 'Open the inSitu Sales prompt directory. It offers suggestions for customers, sales orders, invoices, sales insights, catalog lookup, and a B2B group with create-portal and send-ZIP prompts. Choosing a prompt adds an editable, unsent draft to the native chat input. The interface does not read account data, preview websites, or publish files.';
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
  return args;
}
function createWorkspaceExtension(html, options = {}) {
  if (typeof html !== 'string' || !html.includes('<!doctype html>')) throw new Error('Build the inSitu workspace HTML before enabling the extension.');
  const scope = { companyId: options.companyId == null ? null : String(options.companyId) };
  const resource = { uri: RESOURCE_URI, name: 'insitu-sales-workspace', title: 'inSitu Sales', mimeType: 'text/html;profile=mcp-app' };
  const tool = {
    name: TOOL_NAME, title: 'inSitu Sales', icons: [BRAND_ICON], description,
    inputSchema: schemas[TOOL_NAME],
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      ...(options.entrypoints === false ? {} : { 'openai/ui': { entrypoints: [{ type: 'global' }, { type: 'thread' }] } }),
    },
  };
  return {
    tools: [tool], tool, resource,
    handles: name => name === TOOL_NAME,
    call(name, args = {}) {
      try {
        validatePayload(name, args);
        return {
          content: [{ type: 'text', text: 'Opened the inSitu Sales prompt directory. Choose a suggestion, edit it in the chat input, then send it.' }],
          structuredContent: { view: args.view ?? 'portal', scope, kind: name, data: null },
        };
      } catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
    },
    read(uri) { if (uri !== RESOURCE_URI) throw new Error('Unknown workspace resource'); return { contents: [{ ...resource, text: html, _meta: { ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } }, 'openai/ui': { availableDisplayModes: ['inline', 'fullscreen'] } } }] }; }
  };
}
module.exports = { createWorkspaceExtension, RESOURCE_URI, TOOL_NAME, BRAND_ICON, schemas, validatePayload, validate };
