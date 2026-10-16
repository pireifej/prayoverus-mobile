import fs from 'fs';
import path from 'path';
import { buildLabel } from '../../utils/buildLabel';

test('identifies an embedded launch even though it has an update ID', () => {
  expect(buildLabel({
    channel: 'production', version: '1.0.35', buildNumber: 130,
    isEmbeddedLaunch: true, updateId: 'ff069ca4-5685-4ae4-89ca-8e2f22174c96',
  })).toBe('production-1.0.35 · build 130 · embedded ff069ca4');
});

test('identifies downloaded OTA code independently of the native build number', () => {
  expect(buildLabel({
    channel: 'production', version: '1.0.35', buildNumber: 130,
    isEmbeddedLaunch: false, updateId: '12345678-other',
  })).toBe('production-1.0.35 · build 130 · OTA 12345678');
});

test('checked-in native Android runtime matches the Android override without changing the iOS fallback', () => {
  const root = path.resolve(__dirname, '../..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
  const strings = fs.readFileSync(path.join(root, 'android/app/src/main/res/values/strings.xml'), 'utf8');
  const gradle = fs.readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');
  const nativeRuntime = strings.match(/name="expo_runtime_version">([^<]+)/)?.[1];
  expect(nativeRuntime).toBe(config.android.runtimeVersion);
  expect(config.android.runtimeVersion).not.toBe('1.0.31');
  expect(config.runtimeVersion).toBe('1.0.31');
  expect(gradle).toContain(`versionName "${config.version}"`);
  expect(gradle).toContain(`versionCode ${config.android.versionCode}`);
});
