const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { prepareArchive, publishArchive } = require("../plugins/insitu-sales/skills/insitu-storefront-authoring/scripts/upload-storefront.js");

test("publication helper preserves canonical URL and separate custom-domain readiness", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "storefront-publication-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const archive = path.join(directory, "store.zip");
  await fs.writeFile(archive, Buffer.from("synthetic archive"));
  const artifact = await prepareArchive(archive);
  const grant = { ...artifact, hostname: "cart.b2becommerce.store", authorization: "a".repeat(64),
    expiresAt: new Date(Date.now()+60000).toISOString(),
    uploadUrl: "https://api.insitusales.com/api/v1/b2b-ecommerce/authorized-releases" };
  const server = http.createServer((req,res) => {
    req.resume();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "active", stage: "complete", hostname: grant.hostname,
      release: { siteId: "b".repeat(32), digest: grant.digest }, storefrontUrl: "https://cart.b2becommerce.store",
      customDomain: { hostname: "shop.example.test", status: "pending", unrelated: "private" } }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const result = await publishArchive(archive, grant, {
    request: (_url, options, callback) => http.request(`http://127.0.0.1:${server.address().port}`, options, callback),
  });
  assert.equal(result.status, "active");
  assert.equal(result.storefrontUrl, "https://cart.b2becommerce.store");
  assert.deepEqual(result.customDomain, { hostname: "shop.example.test", status: "pending" });
  assert.doesNotMatch(JSON.stringify(result), /private/);
});
