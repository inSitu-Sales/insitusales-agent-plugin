'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '..');
const envFile = path.join(root, 'env', '.env.dev');
const env = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuid.test(env.TEAMS_APP_ID || '') || !env.INSITUSALES_MCP_AUTH_ID?.trim() ||
    /\$\{|placeholder|todo|example/i.test(env.INSITUSALES_MCP_AUTH_ID)) {
  console.error('Run npm run signin and npm run provision first. Packaging requires actual Microsoft app and DCR configuration IDs.');
  process.exit(1);
}

const command = process.platform === 'win32' ? 'atk.cmd' : 'atk';
const result = spawnSync(command, ['package', '--env', 'dev', '--interactive', 'false', '--telemetry', 'false'], { cwd: root, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
