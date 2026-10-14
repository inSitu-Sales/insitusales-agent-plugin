const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const plugin = path.join(root, "plugins/insitu-sales");
const skillDirectory = path.join(plugin, "skills/insitu-storefront-authoring");
const skillPath = path.join(skillDirectory, "SKILL.md");
const helperPath = path.join(skillDirectory, "scripts/upload-storefront.js");
const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

// These checks protect packaging contracts, not agent instruction following.
test("the Codex manifest resolves a packaged storefront skill and helper", () => {
  const manifest = readJson("plugins/insitu-sales/.codex-plugin/plugin.json");
  assert.equal(manifest.skills, "./skills/");
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(
    skill,
    /^---\nname: insitu-storefront-authoring\ndescription: Use when /,
  );
  assert.ok(fs.statSync(helperPath).isFile());
});

test("the skill checks both pilot tools before starting authoring", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  const preflight = skill
    .split("## Execution and authorization guards\n")[1]
    ?.split("\n## ")[0];
  assert.ok(preflight, "access preflight is missing");
  for (const action of ["getStorefrontCompany", "authorizeStorefrontUpload"]) {
    assert.ok(preflight.includes(action));
  }
  assert.match(preflight, /either tool is missing/);
  assert.match(preflight, /not enabled for storefront authoring yet/);
  assert.match(preflight, /stop before creating storefront files/);
  assert.match(preflight, /Node\.js/);
  assert.match(preflight, /Do not install/);
  assert.match(preflight, /Publication is forbidden/);
  assert.match(preflight, /Once these guards pass, call getStorefrontCompany/);
  assert.match(
    preflight,
    /current administrator authority and hostname ownership/,
  );
  assert.ok(
    skill.indexOf("## Execution and authorization guards") <
      skill.indexOf("## Confirm the storefront brief"),
  );
});

test("the package keeps buyer commerce separate from administrator authorization", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /public storefront GraphQL endpoint/);
  assert.ok(skill.includes("not through MCP tools"));
  assert.ok(
    skill.includes("Never request/export the general plugin OAuth token"),
  );
  assert.ok(skill.includes("do not retry automatically"));
  assert.match(skill, /protected local channel/);
  assert.doesNotMatch(skill, /graphql_(query|mutation)_b2b/);
  assert.doesNotMatch(skill, /testomer|testuser@test\.com|localhost:80/);
});

test("the authoring playbook delegates API contracts to discovery", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /introspection/);
  assert.match(skill, /descriptions/);
  assert.match(skill, /mobile and desktop/);
  assert.match(skill, /Optional fields/);
  assert.doesNotMatch(skill, /```|https?:\/\/|\bb2b[A-Z]\w*\b/);
  assert.doesNotMatch(
    skill,
    /\b\d+\b|\b(?:fixture|testomer|httpStatus|expiresAt|unitPrice|productId|PORTAL_[A-Z_]+)\b/i,
  );
  assert.doesNotMatch(
    skill,
    /\b(?:deferred|initial workflow|test instructions|test cases)\b/i,
  );
});

test("platform manifests and marketplace version fields agree", () => {
  const manifests = [".codex-plugin", ".claude-plugin", ".cursor-plugin"].map(
    (platform) => readJson(`plugins/insitu-sales/${platform}/plugin.json`),
  );
  assert.match(manifests[0].version, /^\d+\.\d+\.\d+$/);
  for (const manifest of manifests)
    assert.equal(manifest.version, manifests[0].version);
  const claude = readJson(".claude-plugin/marketplace.json");
  const cursor = readJson(".cursor-plugin/marketplace.json");
  assert.equal(claude.plugins[0].version, manifests[0].version);
  assert.equal(cursor.plugins[0].version, manifests[0].version);
  assert.equal(cursor.metadata.version, manifests[0].version);
  const codex = readJson(".agents/plugins/marketplace.json");
  assert.equal(codex.plugins[0].source.path, "./plugins/insitu-sales");
});

test("the ChatGPT submission preserves legacy tools and includes only two authoring actions", () => {
  const submission = readJson("chatgpt-app-submission.json");
  const names = Object.keys(submission.tools);
  assert.equal(names.length, 34);
  assert.equal(
    names.filter((name) => /^graphql_(query|mutation)_/.test(name)).length,
    32,
  );
  assert.equal(
    names.filter((name) => name.startsWith("graphql_query_")).length,
    28,
  );
  assert.equal(
    names.filter((name) => name.startsWith("graphql_mutation_")).length,
    4,
  );
  assert.ok(!names.some((name) => /^graphql_(query|mutation)_b2b/.test(name)));
  assert.deepEqual(submission.tools.getStorefrontCompany.annotations, {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  });
  assert.deepEqual(submission.tools.authorizeStorefrontUpload.annotations, {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  });
  for (const name of ["getStorefrontCompany", "authorizeStorefrontUpload"]) {
    const tool = submission.tools[name];
    for (const key of [
      "read_only_justification",
      "open_world_justification",
      "destructive_justification",
    ])
      assert.ok(tool.justifications[key]?.length);
    assert.ok(
      submission.test_cases.some(
        (scenario) => scenario.tools_triggered === name,
      ),
    );
  }
  const authorization = submission.test_cases.find(
    (scenario) => scenario.tools_triggered === "authorizeStorefrontUpload",
  );
  assert.match(authorization.expected_output, /does not upload or publish/i);
  assert.match(authorization.expected_output, /administrator/);
  assert.match(authorization.expected_output, /hostname/);
  assert.match(authorization.expected_output, /general account token/);
  assert.ok(
    submission.negative_test_cases.some((scenario) =>
      /missing authoring tools/i.test(scenario.description),
    ),
  );
  assert.ok(
    submission.negative_test_cases.some((scenario) =>
      /unauthorized publication/i.test(scenario.description),
    ),
  );
  assert.ok(
    submission.negative_test_cases.some((scenario) =>
      /local execution/i.test(scenario.description),
    ),
  );
  for (const scenario of [
    ...submission.test_cases,
    ...submission.negative_test_cases,
  ]) {
    if (scenario.tools_triggered !== null)
      assert.ok(names.includes(scenario.tools_triggered));
  }
});

test("public documentation does not identify pilot companies", () => {
  const documents = [
    "README.md",
    "plugins/insitu-sales/README.md",
    "plugins/insitu-sales/skills/insitu-storefront-authoring/SKILL.md",
    "chatgpt-app-submission.json",
  ];
  for (const file of documents) {
    const content = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(content, /\b(?:11500|11082|11228|12591)\b/, file);
    assert.doesNotMatch(content, /pilot companies[^.\n]*\b\d+\b/i, file);
    assert.doesNotMatch(content, /testomer|testuser@test\.com/i, file);
  }
});

test("all MCP configurations retain the production server", () => {
  for (const file of [
    ".mcp.json",
    "plugins/insitu-sales/.mcp.json",
    "plugins/insitu-sales/mcp.json",
  ]) {
    assert.equal(
      readJson(file).mcpServers.insitu_sales.url,
      "https://api.insitusales.com/mcp",
    );
  }
});

test("the standalone helper prepares exact file bytes without dependencies", () => {
  const result = spawnSync(
    process.execPath,
    [helperPath, "--prepare", skillPath],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const bytes = fs.readFileSync(skillPath);
  assert.deepEqual(JSON.parse(result.stdout), {
    digest: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
  });
});

test("an expired grant is rejected before contacting any transport", async () => {
  const { publishArchive } = require(helperPath);
  let requests = 0;
  const bytes = fs.readFileSync(skillPath);
  const grant = {
    uploadUrl:
      "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
    authorization: "a".repeat(64),
    hostname: "fixture.example.com",
    digest: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
    expiresAt: "2000-01-01T00:00:00.000Z",
  };
  await assert.rejects(
    publishArchive(skillPath, grant, {
      request() {
        requests += 1;
      },
    }),
    /expired/,
  );
  assert.equal(requests, 0);
});
