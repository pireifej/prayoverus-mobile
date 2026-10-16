import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../../..');
const verifier = path.join(projectRoot, 'scripts/verify-android-production-aab.mjs');
const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../app.json'), 'utf8')).expo;
const fixtureDirectories = new Set();

function encodeVarint(value) {
  let remaining = BigInt(value);
  const bytes = [];
  while (remaining > 0x7fn) {
    bytes.push(Number((remaining & 0x7fn) | 0x80n));
    remaining >>= 7n;
  }
  bytes.push(Number(remaining));
  return Buffer.from(bytes);
}

function field(number, wireType, value) {
  const tag = encodeVarint((number << 3) | wireType);
  if (wireType === 0) return Buffer.concat([tag, encodeVarint(value)]);
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  return Buffer.concat([tag, encodeVarint(bytes.length), bytes]);
}

function message(fields) {
  return Buffer.concat(fields);
}

function runtimeResources(runtime) {
  const stringValue = message([field(1, 2, runtime)]);
  const item = message([field(2, 2, stringValue)]);
  const value = message([field(4, 2, item)]);
  const configValue = message([field(2, 2, value)]);
  const entry = message([
    field(2, 2, 'expo_runtime_version'),
    field(6, 2, configValue),
  ]);
  const type = message([
    field(2, 2, 'string'),
    field(3, 2, entry),
  ]);
  const pkg = message([field(3, 2, type)]);
  return message([field(2, 2, pkg)]);
}

function androidManifest({ versionCode, versionName }) {
  const androidNamespace = 'http://schemas.android.com/apk/res/android';
  const stringAttribute = (name, value, namespace = '') => message([
    ...(namespace ? [field(1, 2, namespace)] : []),
    field(2, 2, name),
    field(3, 2, value),
  ]);
  const compiledDecimalAttribute = (name, value) => {
    const primitive = message([field(6, 0, value)]);
    const item = message([field(7, 2, primitive)]);
    return message([
      field(1, 2, androidNamespace),
      field(2, 2, name),
      field(3, 2, String(value)),
      field(6, 2, item),
    ]);
  };
  const element = (name, attributes = [], children = []) => message([
    field(3, 2, name),
    ...attributes.map(attribute => field(4, 2, attribute)),
    ...children.map(child => field(5, 2, child)),
  ]);
  const xmlNode = node => message([field(1, 2, node)]);
  const permission = name => xmlNode(element('uses-permission', [
    stringAttribute('name', name, androidNamespace),
  ]));
  const updatesEnabled = xmlNode(element('meta-data', [
    stringAttribute('name', 'expo.modules.updates.ENABLED', androidNamespace),
    stringAttribute('value', 'true', androidNamespace),
  ]));
  const updatesRuntime = xmlNode(element('meta-data', [
    stringAttribute('name', 'expo.modules.updates.EXPO_RUNTIME_VERSION', androidNamespace),
  ]));
  const application = xmlNode(element('application', [], [updatesEnabled, updatesRuntime]));
  const manifestElement = message([
    field(3, 2, 'manifest'),
    field(4, 2, stringAttribute('package', appConfig.android.package)),
    field(4, 2, compiledDecimalAttribute('versionCode', versionCode)),
    field(4, 2, stringAttribute('versionName', versionName, androidNamespace)),
    field(5, 2, permission('android.permission.CAMERA')),
    field(5, 2, permission('com.google.android.gms.permission.AD_ID')),
    field(5, 2, application),
  ]);
  return xmlNode(manifestElement);
}

function createFixture({
  runtime = appConfig.android.runtimeVersion,
  commitTime,
  nativeVersionCode = 131,
  nativeVersionName = appConfig.version,
} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aab-verifier-test-'));
  fixtureDirectories.add(directory);
  const files = path.join(directory, 'fixture');
  fs.mkdirSync(path.join(files, 'base', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(files, 'base', 'manifest'), { recursive: true });
  fs.writeFileSync(path.join(files, 'base', 'assets', 'app.manifest'), JSON.stringify({
    id: 'f506e8c3-5eb9-4b30-b3b6-1f5d35c2a177',
    commitTime: commitTime ?? Date.parse('2026-10-16T10:03:00.000Z'),
    assets: [],
  }));
  fs.writeFileSync(path.join(files, 'base', 'assets', 'index.android.bundle'), 'BUNDLE_CONTENT_MUST_NOT_BE_PRINTED');
  fs.writeFileSync(path.join(files, 'base', 'manifest', 'AndroidManifest.xml'), androidManifest({
    versionCode: nativeVersionCode,
    versionName: nativeVersionName,
  }));
  fs.writeFileSync(path.join(files, 'base', 'resources.pb'), runtimeResources(runtime));

  const archive = path.join(directory, 'fixture.aab');
  execFileSync('zip', ['-q', '-r', archive, '.'], { cwd: files });

  const build = {
    id: 'a6b11345-9084-4d10-b7e1-32cc5e9f0260',
    status: 'FINISHED',
    platform: 'ANDROID',
    buildProfile: 'production',
    appVersion: appConfig.version,
    appBuildVersion: '131',
    runtimeVersion: appConfig.android.runtimeVersion,
    appIdentifier: appConfig.android.package,
    channel: 'production',
    project: { id: appConfig.extra.eas.projectId },
    createdAt: '2026-10-16T10:00:00.000Z',
    completedAt: '2026-10-16T10:30:00.000Z',
    artifacts: { applicationArchiveUrl: 'https://example.invalid/test.aab' },
  };
  const buildJson = path.join(directory, 'build.json');
  fs.writeFileSync(buildJson, JSON.stringify([build]));
  return { directory, archive, buildJson };
}

function runVerifier(fixture) {
  return spawnSync(process.execPath, [
    verifier,
    '--build-json',
    fixture.buildJson,
    '--artifact',
    fixture.archive,
  ], { encoding: 'utf8' });
}

afterEach(() => {
  for (const directory of fixtureDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  fixtureDirectories.clear();
});

test('verifies native release metadata, embedded update, bundle, and selected feature markers', () => {
  const fixture = createFixture();
  const result = runVerifier(fixture);

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('Expected production Profile:');
  expect(result.stdout).toContain('update f506e8c3');
  expect(result.stdout).toContain('Feature markers: Expo Updates, Camera, Ads');
  expect(result.stdout).not.toContain('BUNDLE_CONTENT_MUST_NOT_BE_PRINTED');
  expect(result.stderr).not.toContain('BUNDLE_CONTENT_MUST_NOT_BE_PRINTED');
});

test('fails when the AAB native runtime differs from the selected production build', () => {
  const fixture = createFixture({ runtime: '1.0.31' });
  const result = runVerifier(fixture);

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Native Android runtime disagrees');
});

test('fails when native Android version metadata differs from the selected production build', () => {
  const fixture = createFixture({ nativeVersionName: '1.0.34' });
  const result = runVerifier(fixture);

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Native Android version name disagrees');
});

test('fails when the embedded update timestamp belongs to a stale artifact', () => {
  const fixture = createFixture({ commitTime: Date.parse('2026-10-15T10:00:00.000Z') });
  const result = runVerifier(fixture);

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('the AAB may be stale');
});
