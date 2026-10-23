'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const Ajv = require('ajv');
const AjvDraft4 = require('ajv-draft-04');
const addFormats = require('ajv-formats');
const YAML = require('yaml');

const root = path.resolve(__dirname, '..');
const packageRoot = path.join(root, 'appPackage');
const sources = {
  app: 'https://developer.microsoft.com/en-us/json-schemas/teams/v1.30/MicrosoftTeams.schema.json',
  agent: 'https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.8/schema.json',
  plugin: 'https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json',
  lifecycle: 'https://aka.ms/m365-agents-toolkits/v1.13/yaml.schema.json',
};

// Fixtures exist only in memory for template validation. No deployable package
// or environment file is produced with these synthetic Microsoft identifiers.
const fixtures = {
  TEAMS_APP_ID: '0d7d033a-9ef0-4a26-8559-6dfb8b0b45cb',
  INSITUSALES_MCP_AUTH_ID: 'a8c45c90-2b1f-4564-94d4-1e6cd53e9f03',
  APP_NAME_SUFFIX: ' (Test)',
};

function renderTemplate(text) {
  return text.replace(/\$\{\{([A-Z0-9_]+)\}\}/g, (_match, name) => {
    assert.ok(Object.hasOwn(fixtures, name), `Unexpected template variable ${name}`);
    return fixtures[name];
  });
}

async function schemaFor(name) {
  const cache = path.join(root, '.validation', 'schemas', `${name}.json`);
  try { return JSON.parse(await fs.readFile(cache, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const response = await fetch(sources[name], { signal: AbortSignal.timeout(20000) });
  assert.ok(response.ok, `Could not fetch ${name} schema: HTTP ${response.status}`);
  const schema = await response.json();
  await fs.mkdir(path.dirname(cache), { recursive: true });
  await fs.writeFile(cache, `${JSON.stringify(schema)}\n`);
  return schema;
}

async function validateSchema(name, document) {
  const schema = await schemaFor(name);
  const Validator = schema.$schema?.includes('draft-04') ? AjvDraft4 : Ajv;
  const ajv = new Validator({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.ok(validate(document), `${name}: ${JSON.stringify(validate.errors)}`);
  console.log(`PASS official Microsoft ${name} schema`);
}

async function json(file) {
  return JSON.parse(renderTemplate(await fs.readFile(path.join(packageRoot, file), 'utf8')));
}

async function validatePng(file, size, transparent) {
  const bytes = await fs.readFile(path.join(packageRoot, file));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), size);
  assert.equal(bytes.readUInt32BE(20), size);
  if (transparent) assert.ok([4, 6].includes(bytes[25]), 'Outline PNG needs an alpha channel');
  console.log(`PASS ${file}: ${size}x${size} PNG`);
}

async function main() {
  const app = await json('manifest.json');
  const agent = await json('declarativeAgent.json');
  const plugin = await json('ai-plugin.json');
  const instructionMatch = agent.instructions.match(/^\$\[file\('([^']+)'\)\]$/);
  assert.ok(instructionMatch, 'Instructions must refer to the packaged instruction file');
  agent.instructions = await fs.readFile(path.join(packageRoot, instructionMatch[1]), 'utf8');
  const lifecycle = YAML.parse(await fs.readFile(path.join(root, 'm365agents.yml'), 'utf8'));
  await validateSchema('app', app);
  await validateSchema('agent', agent);
  await validateSchema('plugin', plugin);
  await validateSchema('lifecycle', lifecycle);
  assert.equal(app.copilotAgents.declarativeAgents[0].file, 'declarativeAgent.json');
  assert.equal(agent.actions[0].file, 'ai-plugin.json');
  assert.equal(plugin.functions.length, 0, 'Use dynamic MCP tool discovery');
  assert.equal(plugin.runtimes.length, 1);
  const runtime = plugin.runtimes[0];
  assert.equal(runtime.type, 'RemoteMCPServer');
  assert.equal(runtime.spec.url, 'https://api.insitusales.com/mcp');
  assert.equal(runtime.spec.mcp_tool_description, undefined);
  assert.deepEqual(runtime.run_for_functions, ['*']);
  assert.equal(runtime.auth.type, 'OAuthPluginVault');
  assert.equal(runtime.auth.reference_id, fixtures.INSITUSALES_MCP_AUTH_ID);
  const registration = lifecycle.provision.find((action) => action.uses === 'dcr/register');
  assert.ok(registration, 'Provisioning must register DCR in Microsoft');
  assert.equal(registration.with.applicableToApps, 'SpecificApp');
  assert.equal(registration.with.targetAudience, 'HomeTenant');
  assert.equal(registration.with.wellKnownAuthorizationServer, 'https://api.insitusales.com/.well-known/oauth-authorization-server');
  assert.deepEqual(registration.with.targetUrlsShouldStartWith, [runtime.spec.url]);
  assert.equal(registration.writeToEnvironmentFile.configurationId, 'INSITUSALES_MCP_AUTH_ID');
  for (const name of ['websiteUrl', 'privacyUrl', 'termsOfUseUrl']) {
    assert.equal(new URL(app.developer[name]).hostname, 'www.insitusales.com');
  }
  assert.ok(!JSON.stringify({ app, agent, plugin }).includes('example.com'), 'Remove template publisher information');
  await validatePng(app.icons.color, 192, false);
  await validatePng(app.icons.outline, 32, true);
  const report = { validatedAt: new Date().toISOString(), result: 'passed', mode: 'local-template-validation', schemas: sources, tenantInstalled: false, microsoftOAuthTested: false, toolsExecuted: false };
  await fs.mkdir(path.join(root, '.validation'), { recursive: true });
  await fs.writeFile(path.join(root, '.validation', 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('PASS references, DCR configuration, dynamic discovery and publisher metadata');
  console.log('Local templates validated. Tenant provisioning and actual Microsoft tool calls are separate checks.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
