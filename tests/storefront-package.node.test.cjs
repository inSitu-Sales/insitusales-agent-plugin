const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { EventEmitter } = require("node:events");
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

test("storefront discovery recognizes English and Spanish requests", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  const description = skill
    .split("\n")
    .find((line) => line.startsWith("description:"));
  for (const phrase of [
    "create my B2B",
    "online store",
    "crear mi B2B",
    "tienda online",
    "catálogo online",
  ])
    assert.ok(description.includes(phrase), `missing trigger ${phrase}`);
  assert.match(skill, /Respond in the user's language/);
  assert.match(skill, /existing brief/);
  assert.match(skill, /outdated tool definition/);
  assert.match(skill, /Do not invent.*hostname/);
});

test("Codex offers bilingual storefront starters while retaining sales suggestions", () => {
  const { interface: presentation } = readJson(
    "plugins/insitu-sales/.codex-plugin/plugin.json",
  );
  assert.ok(presentation.defaultPrompt.includes("Show me today’s invoices"));
  assert.ok(
    presentation.defaultPrompt.includes(
      "What were my top-selling products last week?",
    ),
  );
  for (const beginning of [
    "Help me create my B2B storefront",
    "Ayúdame a crear mi tienda B2B",
  ])
    assert.ok(
      presentation.defaultPrompt.some((prompt) => prompt.startsWith(beginning)),
    );
  for (const prompt of presentation.defaultPrompt.slice(2))
    assert.match(prompt, /preview|vista previa/);
});

test("every authored skin requires both legal views and blocks readiness on missing policies", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /Every storefront must include/);
  assert.match(skill, /Privacy Policy.*Terms & Conditions/);
  assert.match(skill, /permanent routes.*discoverable links/);
  assert.match(skill, /missing.*publication readiness/s);
  assert.match(skill, /sanitize executable HTML/);
});

test("authoring has no account-eligibility preflight and leaves authorization to the service", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.doesNotMatch(
    skill,
    /not enabled for storefront authoring yet|stop before creating storefront files|Both .* must be available/,
  );
  assert.match(skill, /server enforces.*administrator.*hostname ownership/i);
  assert.match(skill, /call getStorefrontCompany/);
  assert.match(skill, /Node\.js/);
  assert.match(skill, /Do not install/);
  assert.match(skill, /denied.*stop|stop.*denied/i);
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

test("publication guidance checks helper connectivity before requesting a grant", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  const publication = skill.split("## Review and publish deliberately\n")[1];
  assert.match(publication, /node .*--check-connection/);
  assert.ok(
    publication.indexOf("--check-connection") <
      publication.indexOf("request authorization for that artifact"),
  );
  assert.match(
    publication,
    /same Node\.js executable and execution permissions/,
  );
  assert.match(publication, /request.*network.*permission/i);
  assert.match(publication, /policy.*denies/i);
  assert.match(publication, /does not prove.*publication/i);
  assert.match(publication, /Do not bypass/);
});

test("the authoring playbook delegates API contracts to discovery", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /introspection/);
  assert.match(skill, /descriptions/);
  assert.match(skill, /mobile and desktop/);
  assert.match(skill, /Optional fields/);
  assert.doesNotMatch(skill, /\bb2b[A-Z]\w*\b/);
  assert.doesNotMatch(
    skill,
    /\b\d+\b|\b(?:fixture|testomer|httpStatus|expiresAt|unitPrice|productId|PORTAL_[A-Z_]+)\b/i,
  );
  assert.doesNotMatch(
    skill,
    /\b(?:deferred|initial workflow|test instructions|test cases)\b/i,
  );
});

test("the skill locates maintained template source without replacing service discovery", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /\[maintained skin source\]\(templates\.md\)/);
  const reference = fs.readFileSync(
    path.join(skillDirectory, "templates.md"),
    "utf8",
  );
  assert.match(
    reference,
    /https:\/\/storage\.googleapis\.com\/insitusalesfront-skin-templates\/templates\/default\/source\.tar\.gz/,
  );
  assert.match(reference, /shared business core/);
  assert.match(reference, /release-manifest\.json/);
  assert.match(reference, /SHA-256/);
  assert.match(reference, /generation/);
  assert.match(reference, /empty directory/);
  assert.match(reference, /Do not start downloaded scripts during extraction/);
  assert.match(reference, /frozen lockfile/);
  assert.match(reference, /do not invent/i);
  assert.match(skill, /Preserve the shared commerce workflows/);
  assert.match(reference, /not a company deployment/);
});

test("discovery has a concrete entry point without a copied operation catalog", () => {
  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /\[service discovery\]\(discovery\.md\)/);
  const discovery = fs.readFileSync(
    path.join(skillDirectory, "discovery.md"),
    "utf8",
  );
  assert.match(
    discovery,
    /https:\/\/api\.insitusales\.com\/api\/v1\/b2b-ecommerce\/graphql/,
  );
  for (const term of [
    "__schema",
    "__type",
    "description",
    "includeDeprecated",
    "_selection",
  ])
    assert.ok(discovery.includes(term), `missing discovery anchor ${term}`);
  assert.match(discovery, /default.*nested/i);
  assert.match(discovery, /administrative.*not.*public company query/i);
  assert.match(skill, /call getStorefrontCompany without.*arguments/i);
  assert.match(skill, /Do not ask.*hostname.*alias/i);
  assert.doesNotMatch(skill, /missing decisions: target hostname/);
  assert.doesNotMatch(discovery, /maps to the public company query/);
  assert.match(discovery, /not.*raw company/i);
  assert.match(discovery, /not.*permission/i);
  assert.doesNotMatch(discovery, /PORTAL_[A-Z_]+|b2bPlaceOrder|b2bSignIn/);
  assert.doesNotMatch(
    skill,
    /Show cached display prices|Author-approved design choices take precedence/,
  );
  assert.match(skill, /README/);
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
    assert.doesNotMatch(content, /\bpilot\b/i, file);
    assert.doesNotMatch(
      content,
      /Both authoring tools.*before authoring begins/i,
      file,
    );
    assert.doesNotMatch(content, /testomer|testuser@test\.com/i, file);
  }
});

test("all MCP configurations retain the production server", () => {
  for (const file of [
    ".mcp.json",
    "plugins/insitu-sales/.mcp.json",
    "plugins/insitu-sales/mcp.json",
    "plugins/insitu-sales/.codex-mcp.json",
  ]) {
    assert.equal(
      readJson(file).mcpServers.insitu_sales.url,
      "https://api.insitusales.com/mcp",
    );
  }
});

for (const outcome of ["reachable", "blocked"]) {
  test(`the standalone connection-check command is ${outcome} without reading a ZIP or grant`, () => {
    const preload = `
      import https from 'node:https';
      import assert from 'node:assert/strict';
      import { EventEmitter } from 'node:events';
      let calls = 0;
      https.request = (url, options, callback) => {
        assert.equal(++calls, 1);
        assert.equal(url, 'https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases');
        assert.equal(options.method, 'HEAD');
        assert.equal(options.headers, undefined);
        const request = new EventEmitter();
        request.end = (...args) => {
          assert.equal(args.length, 0);
          ${
            outcome === "reachable"
              ? "callback(Object.assign(new EventEmitter(), { statusCode: 500, resume() {} }));"
              : "request.emit('error', Object.assign(Error('private-wire-details'), { code: 'ENOTFOUND' }));"
          }
        };
        return request;
      };
    `;
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        `data:text/javascript,${encodeURIComponent(preload)}`,
        helperPath,
        "--check-connection",
      ],
      { encoding: "utf8", input: "not-a-grant-do-not-read", timeout: 5000 },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, outcome === "reachable" ? 0 : 1, result.stderr);
    if (outcome === "reachable") {
      assert.deepEqual(JSON.parse(result.stdout), {
        status: "reachable",
        httpStatus: 500,
      });
      assert.equal(result.stderr, "");
    } else {
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /ENOTFOUND/);
      assert.match(result.stderr, /no upload was attempted/i);
    }
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /private-wire-details|not-a-grant-do-not-read/,
    );
  });
}

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

test("the packaged helper reports safe failure details without retrying", async () => {
  const { publishArchive } = require(helperPath);
  const bytes = fs.readFileSync(skillPath);
  const grant = {
    uploadUrl:
      "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
    authorization: "a".repeat(64),
    hostname: "fixture.example.com",
    digest: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  };
  let requests = 0;
  const transport = {
    request(_url, _options, callback) {
      requests += 1;
      const request = new EventEmitter();
      request.setTimeout = () => {};
      request.end = () => {
        const response = new EventEmitter();
        response.statusCode = 503;
        callback(response);
        response.emit(
          "data",
          Buffer.from(JSON.stringify({ message: grant.authorization })),
        );
        response.emit("end");
      };
      return request;
    },
  };
  await assert.rejects(publishArchive(skillPath, grant, transport), (error) => {
    assert.equal(error.httpStatus, 503);
    assert.equal(error.failureStage, "response-contract");
    assert.match(error.message, /HTTP 503/);
    assert.match(error.message, /do not retry automatically/);
    assert.equal(error.message.includes(grant.authorization), false);
    return true;
  });
  assert.equal(requests, 1);
});

test("the packaged helper exposes only an allowlisted network error code", async () => {
  const { publishArchive } = require(helperPath);
  const bytes = fs.readFileSync(skillPath);
  const grant = {
    uploadUrl:
      "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases",
    authorization: "a".repeat(64),
    hostname: "fixture.example.com",
    digest: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  };
  for (const code of ["ENOTFOUND", grant.authorization]) {
    let requests = 0;
    const transport = {
      request() {
        requests += 1;
        const request = new EventEmitter();
        request.setTimeout = () => {};
        request.end = () =>
          request.emit(
            "error",
            Object.assign(Error(grant.authorization), { code }),
          );
        return request;
      },
    };
    await assert.rejects(
      publishArchive(skillPath, grant, transport),
      (error) => {
        assert.equal(error.transportCode, code === "ENOTFOUND" ? code : null);
        assert.equal(error.httpStatus, null);
        assert.equal(error.failureStage, "network");
        assert.equal(error.message.includes(grant.authorization), false);
        assert.match(error.message, /do not retry automatically/);
        return true;
      },
    );
    assert.equal(requests, 1);
  }
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
