import React from 'react';
import { Text } from 'react-native';

// Decode common HTML entities to plain text
const decodeHtml = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

// Renders HTML with <strong> bold and <br> newlines in React Native Text
export default function HtmlText({ html, style }) {
  if (!html) return null;

  // Replace <br> with newlines
  let tempHtml = html.replace(/<br\s*\/?>/gi, '\n');

  // Split by <strong>...</strong> tags
  const strongRegex = /<strong>(.*?)<\/strong>/gi;
  const splits = [];
  let lastIdx = 0;

  tempHtml.replace(strongRegex, (match, content, offset) => {
    if (offset > lastIdx) splits.push({ text: tempHtml.substring(lastIdx, offset), bold: false });
    splits.push({ text: content, bold: true });
    lastIdx = offset + match.length;
  });

  if (lastIdx < tempHtml.length) {
    splits.push({ text: tempHtml.substring(lastIdx), bold: false });
  }

  return (
    <Text style={style} selectable={true}>
      {splits.map((part, index) => (
        <Text key={index} style={part.bold ? { fontWeight: 'bold' } : {}}>
          {decodeHtml(part.text)}
        </Text>
      ))}
    </Text>
  );
}
