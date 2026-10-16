export function buildLabel({ channel, version, buildNumber, isEmbeddedLaunch, updateId }) {
  const source = isEmbeddedLaunch ? 'embedded' : 'OTA';
  const shortId = typeof updateId === 'string' && updateId ? ` ${updateId.slice(0, 8)}` : '';
  return `${channel || 'local'}-${version || '?'} · build ${buildNumber ?? '?'} · ${source}${shortId}`;
}
