// ─── Pure utility helpers — no React, no state ────────────────────────────────

// Base64 encoding that works in both web and React Native
export const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  } else {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
};

// Base64 encoding used by PrayerOptionsMenu (pure JS implementation, no Buffer)
export const base64EncodeForMenu = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const chr1 = str.charCodeAt(i);
    const chr2 = str.charCodeAt(i + 1);
    const chr3 = str.charCodeAt(i + 2);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = isNaN(chr3) ? 64 : chr3 & 63;
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
};

// Convert markdown bold (**text**) to HTML <strong> tags
export const markdownToHtml = (text) => {
  if (!text) return text;
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

// Compare version strings e.g. "1.0.21" > "1.0.20"
export const isNewerVersion = (latest, current) => {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);
  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latestPart = latestParts[i] || 0;
    const currentPart = currentParts[i] || 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  return false;
};

// ─── Faith Rank System ────────────────────────────────────────────────────────

export const FAITH_RANKS = [
  { level: 0,  title: 'Newcomer',            minPoints: 0,     icon: '🌱' },
  { level: 1,  title: 'New Believer',        minPoints: 1,     icon: '🕊️' },
  { level: 2,  title: 'Seed Planter',        minPoints: 20,    icon: '🌿' },
  { level: 3,  title: 'Growing in Faith',    minPoints: 50,    icon: '📖' },
  { level: 4,  title: 'Prayer Partner',      minPoints: 100,   icon: '🤝' },
  { level: 5,  title: 'Faithful Friend',     minPoints: 150,   icon: '💛' },
  { level: 6,  title: 'Prayer Leader',       minPoints: 250,   icon: '📿' },
  { level: 7,  title: 'Devoted Believer',    minPoints: 350,   icon: '✝️' },
  { level: 8,  title: 'Prayer Champion',     minPoints: 500,   icon: '🏆' },
  { level: 9,  title: 'Faithful Servant',    minPoints: 750,   icon: '⭐' },
  { level: 10, title: 'Prayer Warrior',      minPoints: 1000,  icon: '👑' },
];

export const getFaithRank = (pointsOrRankObj, backendRank) => {
  if (backendRank && typeof backendRank === 'object' && backendRank.level !== undefined) {
    const nr = backendRank.next_rank || backendRank.nextRank || null;
    const actualPoints = (typeof pointsOrRankObj === 'number' && pointsOrRankObj > 0)
      ? pointsOrRankObj
      : (backendRank.points || 0);
    const currentMin = backendRank.min_points || 0;
    const nextMin = nr ? (nr.min_points || nr.minPoints || 0) : 0;
    let progress;
    if (!nr) {
      progress = 1;
    } else if (nextMin > currentMin) {
      progress = Math.min((actualPoints - currentMin) / (nextMin - currentMin), 1);
    } else {
      progress = backendRank.progress != null ? backendRank.progress : 1;
    }
    return {
      level: backendRank.level,
      title: backendRank.title,
      icon: backendRank.icon || '🛡️',
      minPoints: currentMin,
      points: actualPoints,
      nextRank: nr ? { level: nr.level, title: nr.title, icon: nr.icon, minPoints: nextMin } : null,
      progress: Math.max(0, progress),
      maxPoints: nr ? nextMin : 1,
      name: backendRank.title,
    };
  }
  const p = (typeof pointsOrRankObj === 'number' ? pointsOrRankObj : 0) || 0;
  let rank = FAITH_RANKS[0];
  for (let i = FAITH_RANKS.length - 1; i >= 0; i--) {
    if (p >= FAITH_RANKS[i].minPoints) { rank = FAITH_RANKS[i]; break; }
  }
  const nextRank = FAITH_RANKS.find(r => r.level === rank.level + 1);
  const progress = nextRank
    ? (p - rank.minPoints) / (nextRank.minPoints - rank.minPoints)
    : 1;
  return {
    ...rank,
    points: p,
    nextRank,
    progress: Math.min(progress, 1),
    maxPoints: nextRank ? nextRank.minPoints : 1,
    name: rank.title,
  };
};
