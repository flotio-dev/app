import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const DEFAULT_BASE_URL = 'http://localhost:3001';
const baseUrl = process.env.E2E_BASE_URL || DEFAULT_BASE_URL;
const shouldStartServer = !process.env.E2E_BASE_URL;
const isCI = process.env.CI === 'true';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
      lastError = new Error(`Server responded with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? 'unknown error'}`);
}

async function startServer() {
  const nextCli = resolve(projectRoot, 'node_modules/next/dist/bin/next');
  const child = spawn(process.execPath, [nextCli, 'dev', '--turbopack', '-p', '3001'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });

  child.stdout.on('data', (chunk) => process.stdout.write(`[next] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[next] ${chunk}`));

  child.once('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`Next dev server exited with code ${code}`);
    }
  });

  await waitForServer(baseUrl);
  return child;
}

async function goto(page, path) {
  await page.goto(new URL(path, baseUrl).toString(), { waitUntil: 'networkidle0' });
}

async function textContent(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  return page.$eval(selector, (element) => element.textContent?.trim() ?? '');
}

test('home redirects anonymous users to login', async ({ page }) => {
  await goto(page, '/');

  assert.equal(new URL(page.url()).pathname, '/auth/login');
  assert.equal(await textContent(page, 'h3'), 'Welcome back');
});

test('login page renders and links to registration', async ({ page }) => {
  await goto(page, '/auth/login');

  assert.equal(await textContent(page, 'h3'), 'Welcome back');
  assert.ok(await page.$('input[placeholder="Email"]'), 'Expected an email input');
  assert.ok(await page.$('input[placeholder="Password"]'), 'Expected a password input');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('a[href="/auth/register"]'),
  ]);

  assert.equal(new URL(page.url()).pathname, '/auth/register');
  assert.equal(await textContent(page, 'h3'), 'Create account');
});

test('register page renders expected fields', async ({ page }) => {
  await goto(page, '/auth/register');

  assert.equal(await textContent(page, 'h3'), 'Create account');
  assert.ok(await page.$('input[placeholder="Email"]'), 'Expected an email input');
  assert.ok(await page.$('input[placeholder="Username"]'), 'Expected a username input');
  assert.ok(await page.$('input[placeholder="Password"]'), 'Expected a password input');
  assert.ok(await page.$('input[placeholder="Confirm password"]'), 'Expected a confirm password input');
});

let server;
let browser;

try {
  if (shouldStartServer) {
    server = await startServer();
  } else {
    await waitForServer(baseUrl);
  }

  browser = await puppeteer.launch({
    headless: isCI ? 'new' : true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(30_000);

  for (const { name, fn } of tests) {
    await fn({ page });
    console.log(`ok - ${name}`);
  }

  console.log(`${tests.length} E2E tests passed`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
