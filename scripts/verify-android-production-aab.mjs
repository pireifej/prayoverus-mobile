#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, '..');
const PROJECT_DIR = path.join(WORKSPACE_DIR, 'expo-app');
const CONFIG_PATH = path.join(PROJECT_DIR, 'app.json');
const EAS = path.join(WORKSPACE_DIR, 'node_modules', '.bin', 'eas');
const CLOCK_SKEW_MS = 10 * 60 * 1000;
const MAX_ENTRY_BYTES = 128 * 1024 * 1024;

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!['--build-id', '--build-json', '--artifact'].includes(key)) {
      fail('Usage: verify-android-production-aab.mjs (--build-id ID | --build-json FILE) [--artifact FILE]');
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      fail(`Missing value for ${key}.`);
    }
    if (args[key]) {
      fail(`Option ${key} may only be provided once.`);
    }
    args[key] = value;
    index += 1;
  }

  if (Boolean(args['--build-id']) === Boolean(args['--build-json'])) {
    fail('Provide exactly one of --build-id or --build-json.');
  }
  return args;
}

function loadJson(filePath, description) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    fail(`Could not read valid ${description}.`);
  }
}

function loadBuildFromId(buildId) {
  let output;
  try {
    output = execFileSync(EAS, ['build:view', buildId, '--json'], {
      cwd: PROJECT_DIR,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    fail('Could not retrieve the selected EAS build record.');
  }
  try {
    return JSON.parse(output);
  } catch {
    fail('EAS returned invalid build metadata.');
  }
}

function asBuildRecord(response) {
  const builds = Array.isArray(response) ? response : [response];
  if (builds.length !== 1 || !builds[0] || typeof builds[0] !== 'object') {
    fail('Expected exactly one EAS build record.');
  }
  return builds[0];
}

function parseVarint(buffer, offset) {
  let value = 0n;
  let shift = 0n;
  let cursor = offset;
  while (cursor < buffer.length && shift < 70n) {
    const byte = buffer[cursor];
    cursor += 1;
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return { value, offset: cursor };
    }
    shift += 7n;
  }
  fail('Malformed Android artifact metadata.');
}

function parseProtoFields(buffer) {
  const fields = [];
  let offset = 0;
  while (offset < buffer.length) {
    const tag = parseVarint(buffer, offset);
    offset = tag.offset;
    const fieldNumber = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);
    if (fieldNumber === 0) {
      fail('Malformed Android artifact metadata.');
    }

    if (wireType === 0) {
      const parsed = parseVarint(buffer, offset);
      fields.push({ fieldNumber, wireType, value: parsed.value });
      offset = parsed.offset;
    } else if (wireType === 1) {
      if (offset + 8 > buffer.length) fail('Malformed Android artifact metadata.');
      fields.push({ fieldNumber, wireType, bytes: buffer.subarray(offset, offset + 8) });
      offset += 8;
    } else if (wireType === 2) {
      const length = parseVarint(buffer, offset);
      offset = length.offset;
      if (length.value > BigInt(buffer.length - offset)) {
        fail('Malformed Android artifact metadata.');
      }
      const end = offset + Number(length.value);
      fields.push({ fieldNumber, wireType, bytes: buffer.subarray(offset, end) });
      offset = end;
    } else if (wireType === 5) {
      if (offset + 4 > buffer.length) fail('Malformed Android artifact metadata.');
      fields.push({ fieldNumber, wireType, bytes: buffer.subarray(offset, offset + 4) });
      offset += 4;
    } else {
      fail('Unsupported Android artifact metadata encoding.');
    }
  }
  return fields;
}

function lengthDelimited(fields, fieldNumber) {
  return fields
    .filter(field => field.fieldNumber === fieldNumber && field.wireType === 2)
    .map(field => field.bytes);
}

function utf8(buffer) {
  const value = buffer.toString('utf8');
  return Buffer.from(value, 'utf8').equals(buffer) ? value : null;
}

function parseAndroidManifest(buffer) {
  const root = parseProtoFields(buffer);
  const rootElements = lengthDelimited(root, 1).map(parseProtoFields);
  const manifestElement = rootElements.find(element =>
    lengthDelimited(element, 3).map(utf8).includes('manifest'),
  );
  if (!manifestElement) {
    fail('The AAB does not contain readable native Android release metadata.');
  }
  const attributes = lengthDelimited(manifestElement, 4).map(parseProtoFields);
  const findAttribute = (name, namespaceUri) => attributes.find(attribute =>
    lengthDelimited(attribute, 2).map(utf8).includes(name) &&
    (lengthDelimited(attribute, 1).map(utf8).find(Boolean) ?? '') === namespaceUri,
  );
  const attributeValue = attribute => {
    if (!attribute) return undefined;
    const compiledItems = lengthDelimited(attribute, 6).map(parseProtoFields);
    for (const item of compiledItems) {
      for (const stringField of [2, 3, 4]) {
        for (const stringBytes of lengthDelimited(item, stringField)) {
          const stringFields = parseProtoFields(stringBytes);
          const value = lengthDelimited(stringFields, 1).map(utf8).find(Boolean);
          if (value !== undefined) return value;
        }
      }
    }
    return lengthDelimited(attribute, 3).map(utf8).find(Boolean);
  };
  const packageName = attributeValue(findAttribute('package', ''));
  const versionName = attributeValue(findAttribute('versionName', 'http://schemas.android.com/apk/res/android'));
  const versionCodeAttribute = findAttribute('versionCode', 'http://schemas.android.com/apk/res/android');
  const versionCodes = [];
  if (versionCodeAttribute) {
    for (const itemBytes of lengthDelimited(versionCodeAttribute, 6)) {
      const item = parseProtoFields(itemBytes);
      for (const primitiveBytes of lengthDelimited(item, 7)) {
        const primitive = parseProtoFields(primitiveBytes);
        versionCodes.push(...primitive
          .filter(field => field.fieldNumber === 6 && field.wireType === 0)
          .map(field => field.value));
      }
    }
    if (versionCodes.length === 0) {
      const decimalValue = attributeValue(versionCodeAttribute);
      if (decimalValue && /^\d+$/.test(decimalValue)) versionCodes.push(BigInt(decimalValue));
    }
  }
  if (!packageName || !versionName || versionCodes.length !== 1) {
    fail('The AAB does not contain readable native Android release metadata.');
  }
  const versionCode = Number(versionCodes[0]);
  if (!Number.isSafeInteger(versionCode) || versionCode < 1) {
    fail('The AAB contains an invalid native Android version code.');
  }
  return { packageName, versionName, versionCode };
}

function resourceStringValues(buffer) {
  const values = new Set();
  const table = parseProtoFields(buffer);
  for (const packageBytes of lengthDelimited(table, 2)) {
    const pkg = parseProtoFields(packageBytes);
    for (const typeBytes of lengthDelimited(pkg, 3)) {
      const type = parseProtoFields(typeBytes);
      const typeName = lengthDelimited(type, 2).map(utf8).find(Boolean);
      if (typeName !== 'string') continue;

      for (const entryBytes of lengthDelimited(type, 3)) {
        const entry = parseProtoFields(entryBytes);
        const entryName = lengthDelimited(entry, 2).map(utf8).find(Boolean);
        if (entryName !== 'expo_runtime_version') continue;

        for (const configBytes of lengthDelimited(entry, 6)) {
          const configValue = parseProtoFields(configBytes);
          for (const valueBytes of lengthDelimited(configValue, 2)) {
            const value = parseProtoFields(valueBytes);
            for (const itemBytes of lengthDelimited(value, 4)) {
              const item = parseProtoFields(itemBytes);
              for (const fieldNumber of [2, 3, 4]) {
                for (const stringBytes of lengthDelimited(item, fieldNumber)) {
                  const stringValue = parseProtoFields(stringBytes);
                  for (const textBytes of lengthDelimited(stringValue, 1)) {
                    const text = utf8(textBytes);
                    if (text !== null) values.add(text);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return values;
}

function readAabEntry(archivePath, entryName) {
  try {
    return execFileSync('unzip', ['-p', archivePath, entryName], {
      encoding: 'buffer',
      maxBuffer: MAX_ENTRY_BYTES,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    fail(`The AAB is missing a required artifact entry: ${entryName}.`);
  }
}

function hasAabEntry(archivePath, entryName) {
  try {
    const listing = execFileSync('unzip', ['-Z1', archivePath, entryName], {
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return listing.split(/\r?\n/).includes(entryName);
  } catch {
    return false;
  }
}

function validateBuild(build, config) {
  if (build.status !== 'FINISHED') fail('The selected EAS build is not finished.');
  if (build.platform !== 'ANDROID') fail('The selected EAS build is not an Android build.');
  if (build.buildProfile !== 'production') fail('The selected EAS build does not use the production profile.');
  if (build.channel !== 'production') fail('The selected EAS build does not target the production update channel.');

  const expected = {
    appVersion: config.version,
    runtimeVersion: config.android?.runtimeVersion ?? config.runtimeVersion,
    packageName: config.android?.package,
    projectId: config.extra?.eas?.projectId,
  };
  if (!expected.appVersion || !expected.runtimeVersion || !expected.packageName || !expected.projectId) {
    fail('Local Android release configuration is missing a version, runtime, package name, or EAS project ID.');
  }
  console.log(
    `Expected production Profile: app ${expected.appVersion} · runtime ${expected.runtimeVersion} · package ${expected.packageName}`,
  );

  if (build.appVersion !== expected.appVersion) {
    fail('The selected EAS build app version does not match the local production release configuration.');
  }
  if (build.runtimeVersion !== expected.runtimeVersion) {
    fail('The selected EAS build runtime does not match the local Android runtime configuration.');
  }
  if (build.appIdentifier !== expected.packageName) {
    fail('The selected EAS build package name does not match the local Android package name.');
  }
  if (build.project?.id !== expected.projectId) {
    fail('The selected EAS build belongs to a different Expo project.');
  }

  const expectedVersionCode = Number(build.appBuildVersion);
  if (!Number.isSafeInteger(expectedVersionCode) || expectedVersionCode < 1) {
    fail('The selected EAS build record has no valid Android version code.');
  }
  const createdAt = Date.parse(build.createdAt);
  const completedAt = Date.parse(build.completedAt);
  if (!Number.isFinite(createdAt) || !Number.isFinite(completedAt) || completedAt < createdAt) {
    fail('The selected EAS build record has invalid build timestamps.');
  }

  return { ...expected, expectedVersionCode, createdAt, completedAt };
}

function validateArtifact(archivePath, build, expected) {
  if (!hasAabEntry(archivePath, 'base/assets/index.android.bundle')) {
    fail('The AAB does not contain its embedded Android JavaScript bundle.');
  }

  const nativeManifestBytes = readAabEntry(archivePath, 'base/manifest/AndroidManifest.xml');
  const resourcesBytes = readAabEntry(archivePath, 'base/resources.pb');
  const embeddedManifestBytes = readAabEntry(archivePath, 'base/assets/app.manifest');
  const nativeManifest = parseAndroidManifest(nativeManifestBytes);
  const embeddedManifest = (() => {
    try {
      return JSON.parse(embeddedManifestBytes.toString('utf8'));
    } catch {
      fail('The AAB contains an invalid embedded update manifest.');
    }
  })();

  if (nativeManifest.packageName !== expected.packageName) {
    fail('Native Android package name disagrees with the selected EAS build.');
  }
  if (nativeManifest.versionName !== expected.appVersion || nativeManifest.versionName !== build.appVersion) {
    fail('Native Android version name disagrees with the selected EAS build.');
  }
  if (nativeManifest.versionCode !== expected.expectedVersionCode) {
    fail('Native Android version code disagrees with the selected EAS build.');
  }

  const runtimeValues = resourceStringValues(resourcesBytes);
  if (runtimeValues.size !== 1 || !runtimeValues.has(expected.runtimeVersion)) {
    fail('Native Android runtime disagrees with the selected EAS build or is ambiguous.');
  }

  const updateId = embeddedManifest.id;
  if (typeof updateId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(updateId)) {
    fail('The AAB does not contain a valid embedded update UUID.');
  }
  const commitTime = Number(embeddedManifest.commitTime);
  if (!Number.isFinite(commitTime) ||
      commitTime < expected.createdAt - CLOCK_SKEW_MS ||
      commitTime > expected.completedAt + CLOCK_SKEW_MS) {
    fail('The embedded update timestamp is outside the selected EAS build window; the AAB may be stale.');
  }

  const manifestText = nativeManifestBytes.toString('latin1');
  const featureMarkers = [
    ['Expo Updates', 'expo.modules.updates.ENABLED'],
    ['Camera', 'android.permission.CAMERA'],
    ['Ads', 'com.google.android.gms.permission.AD_ID'],
  ];
  const missingMarkers = featureMarkers
    .filter(([, marker]) => !manifestText.includes(marker))
    .map(([label]) => label);
  if (missingMarkers.length > 0) {
    fail(`The AAB is missing expected native feature markers: ${missingMarkers.join(', ')}.`);
  }

  console.log(
    `Artifact: ${nativeManifest.versionName} (code ${nativeManifest.versionCode}) · runtime ${expected.runtimeVersion} · update ${updateId.slice(0, 8)} · embedded bundle present`,
  );
  console.log(`Feature markers: ${featureMarkers.map(([label]) => label).join(', ')}`);
  console.log(`Build ${String(build.id ?? '').slice(0, 8)} verified. No update was published and nothing was submitted to Play.`);
}

async function downloadArtifact(url, destination) {
  let response;
  try {
    response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(300_000) });
  } catch {
    fail('Could not download the completed EAS Android artifact.');
  }
  let responseProtocol;
  try {
    responseProtocol = new URL(response.url).protocol;
  } catch {
    fail('Could not download the completed EAS Android artifact over HTTPS.');
  }
  if (!response.ok || !response.body || responseProtocol !== 'https:') {
    fail('Could not download the completed EAS Android artifact over HTTPS.');
  }
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { mode: 0o600 }));
  } catch {
    fail('The completed EAS Android artifact could not be saved for inspection.');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const build = asBuildRecord(args['--build-json']
    ? loadJson(args['--build-json'], 'EAS build metadata')
    : loadBuildFromId(args['--build-id']));
  const config = loadJson(CONFIG_PATH, 'local Expo configuration').expo;
  const expected = validateBuild(build, config);

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'android-aab-verify-'));
  try {
    const artifactPath = args['--artifact']
      ? path.resolve(args['--artifact'])
      : path.join(tempDir, 'production.aab');
    if (!args['--artifact']) {
      const url = build.artifacts?.applicationArchiveUrl;
      let urlProtocol;
      try {
        urlProtocol = new URL(url).protocol;
      } catch {
        fail('The completed EAS build record does not contain a secure AAB download URL.');
      }
      if (typeof url !== 'string' || urlProtocol !== 'https:') {
        fail('The completed EAS build record does not contain a secure AAB download URL.');
      }
      await downloadArtifact(url, artifactPath);
    }
    validateArtifact(artifactPath, build, expected);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`Android AAB verification failed: ${error.message}`);
  process.exitCode = 1;
});
