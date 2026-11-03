import test from 'node:test';
import assert from 'node:assert/strict';
import extension from '../server/workspace.cjs';

test('the remote prompt directory exposes one read-only opener', () => {
  const workspace = extension.createWorkspaceExtension('<!doctype html>');
  assert.deepEqual(workspace.tools.map(tool => tool.name), ['openInsituWorkspace']);
  assert.deepEqual(workspace.tool._meta['openai/ui'].entrypoints, [{type:'global'}, {type:'thread'}]);
  assert.equal(workspace.tool.annotations.readOnlyHint, true);
  assert.equal(workspace.call(extension.TOOL_NAME).structuredContent.data, null);
  assert.equal(workspace.handles('renderInsituPortalPlan'), false);
  assert.equal(workspace.call('renderInsituPortalPlan', {}).isError, true);
});

test('the local companion does not register a second sidebar or conversation entrypoint', () => {
  const workspace = extension.createWorkspaceExtension('<!doctype html>', {entrypoints:false});
  assert.equal(workspace.tool._meta['openai/ui'], undefined);
  assert.ok(workspace.tool._meta.ui.resourceUri);
  assert.equal(workspace.call(extension.TOOL_NAME).isError, undefined);
});

test('the prompt directory cannot expose arbitrary local files or business payloads', () => {
  const workspace = extension.createWorkspaceExtension('<!doctype html>', {companyId:123});
  assert.equal(workspace.call(extension.TOOL_NAME).structuredContent.scope.companyId, '123');
  assert.equal(workspace.call(extension.TOOL_NAME, {view:'invalid'}).isError, true);
  assert.equal(workspace.call(extension.TOOL_NAME, {projectId:'private'}).isError, true);
  assert.throws(() => workspace.read('file:///etc/passwd'));
  assert.deepEqual(workspace.read(extension.RESOURCE_URI).contents[0]._meta.ui.csp, {connectDomains:[], resourceDomains:[]});
});
