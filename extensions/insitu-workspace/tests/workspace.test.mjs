import test from 'node:test';
import assert from 'node:assert/strict';
import extension from '../server/workspace.cjs';
import { fixtures } from '../web/fixtures.mjs';

test('the native sidebar and conversation entrypoints share the website app', () => {
  const workspace = extension.createWorkspaceExtension('<!doctype html>');
  assert.deepEqual(workspace.tools.map((tool) => tool.name), ['openInsituWorkspace', 'renderInsituPortalPlan']);
  assert.deepEqual(workspace.tool._meta['openai/ui'].entrypoints, [{ type: 'global' }, { type: 'thread' }]);
  assert.equal(workspace.tool.title, 'inSitu Sales');
  assert.deepEqual(workspace.read(extension.RESOURCE_URI).contents[0]._meta['openai/ui'].availableDisplayModes, ['inline', 'fullscreen']);
  assert.equal(workspace.call(extension.TOOL_NAME).structuredContent.view, 'portal');
  assert.equal(workspace.handles('renderInsituSalesDraft'), false);
  assert.equal(workspace.call('renderInsituDashboard', {}).isError, true);
});
test('website layouts are validated and scoped without publishing or changing records', () => {
  const workspace = extension.createWorkspaceExtension('<!doctype html>', { companyId: 123 });
  const result = workspace.call('renderInsituPortalPlan', fixtures.portal);
  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent.scope.companyId, '123');
  assert.equal(result.structuredContent.data.hostname, 'acme.example.com');
  assert.ok(workspace.tools.every((tool) => tool.annotations.readOnlyHint));
  assert.equal(workspace.call('renderInsituPortalPlan', { ...fixtures.portal, hostname: 'https://example.com/path' }).isError, true);
  assert.equal(workspace.call('renderInsituPortalPlan', { ...fixtures.portal, previewUrl: 'javascript:alert(1)' }).isError, true);
  assert.equal(workspace.call('renderInsituPortalPlan', { ...fixtures.portal, previewUrl: 'https://user:secret@example.com' }).isError, true);
});
test('unknown resources cannot expose files, and a new account starts empty', () => {
  const a = extension.createWorkspaceExtension('<!doctype html>', { companyId: 1 });
  const b = extension.createWorkspaceExtension('<!doctype html>', { companyId: 2 });
  a.call('renderInsituPortalPlan', fixtures.portal);
  assert.equal(b.call(extension.TOOL_NAME).structuredContent.data, null);
  assert.throws(() => a.read('file:///etc/passwd'));
  assert.deepEqual(a.read(extension.RESOURCE_URI).contents[0]._meta.ui.csp, { connectDomains: [], resourceDomains: [] });
});


test('a new-company preview does not require or invent a hostname', () => {
  const workspace = extension.createWorkspaceExtension('<!doctype html>');
  const { hostname: _hostname, ...plan } = fixtures.portal;
  const result = workspace.call('renderInsituPortalPlan', plan);
  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent.data.hostname, undefined);
  assert.equal(result.structuredContent.data.title, plan.title);
  assert.equal(workspace.call('renderInsituPortalPlan', { ...plan, hostname: 'invalid' }).isError, true);
});
