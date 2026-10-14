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
    .split("## Check access and local capabilities\n")[1]
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
  assert.ok(
    skill.indexOf("## Check access and local capabilities") <
      skill.indexOf("## Confirm the storefront brief"),
  );
});

test("the package keeps buyer commerce separate from administrator authorization", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.ok(
    skill.includes("https://api.insitusales.com/api/v1/b2b-ecommerce/graphql"),
  );
  assert.ok(skill.includes("not through MCP tools"));
  assert.ok(
    skill.includes("Never request/export the general plugin OAuth token"),
  );
  assert.ok(skill.includes("do not retry automatically"));
  assert.ok(skill.includes("mode0600"));
  assert.doesNotMatch(skill, /graphql_(query|mutation)_b2b/);
  assert.doesNotMatch(skill, /testomer|testuser@test\.com|localhost:80/);
});

test("platform manifests and marketplace version fields agree", () => {
  const manifests = [".codex-plugin", ".claude-plugin", ".cursor-plugin"].map(
    (platform) => readJson(`plugins/insitu-sales/${platform}/plugin.json`),
  );
  assert.equal(manifests[0].version, "1.0.5");
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
