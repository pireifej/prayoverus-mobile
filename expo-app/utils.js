import React from 'react';
import { View, Text, Image } from 'react-native';

// ─── Timestamp formatting ─────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function getRelativeTime(dateInput) {
  if (!dateInput) return '';

  const now  = new Date();
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : '';

  const diffMs    = now - date;
  const diffSecs  = Math.floor(diffMs / 1000);
  const diffMins  = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffSecs  <  60) return 'Just now';
  if (diffMins  <  60) return `${diffMins}m ago`;
  if (diffHours <  24) return `${diffHours}h ago`;
  if (diffDays  <   7) return `${diffDays}d ago`;

  const label = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label}, ${date.getFullYear()}`;
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
