import React from 'react';
import { View, Text, Image } from 'react-native';

// ─── Timestamp formatting ─────────────────────────────────────────────────────

export function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff   = Date.now() - new Date(timestamp).getTime();
  if (isNaN(diff)) return typeof timestamp === 'string' ? timestamp : '';
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  const months  = Math.floor(days / 30);
  if (months  >= 1) return `${months}mo ago`;
  if (days    >= 1) return `${days}d ago`;
  if (hours   >= 1) return `${hours}h ago`;
  return `${minutes}m ago`;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

export const RELIGIOUS_EMOJIS = [
  '🕊️', '🙏', '📿', '✝️', '🕯️', '📖', '⭐', '🌿', '☀️', '💛', '🌸', '🌈',
];

const AVATAR_COLORS = [
  '#1e40af', '#0369a1', '#0891b2', '#0d9488',
  '#047857', '#b45309', '#c2410c', '#9f1239', '#4f46e5',
];

export function resolveAvatarUri(picture) {
  if (!picture || picture.trim() === '' || picture === 'defaultUser.png') return null;
  if (picture.startsWith('http')) return picture;
  return `https://shouldcallpaul.replit.app/${picture}`;
}

export function getInitials(firstName = '', lastName = '') {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f.length >= 2) return f.slice(0, 2).toUpperCase();
  if (f.length === 1) return f[0].toUpperCase();
  return '?';
}

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({ picUri, name = '', lastName = '', emoji, size = 44, style }) {
  const base = { width: size, height: size, borderRadius: size / 2 };

  if (picUri) {
    return <Image source={{ uri: picUri }} style={[base, style]} />;
  }

  if (emoji) {
    return (
      <View style={[base, { backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ fontSize: size * 0.46, lineHeight: size * 0.62 }}>{emoji}</Text>
      </View>
    );
  }

  const initials = getInitials(name, lastName);
  const color = getAvatarColor(name);
  return (
    <View style={[base, { backgroundColor: color, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.38, color: '#fff', fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}
