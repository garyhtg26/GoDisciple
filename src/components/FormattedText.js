import React from 'react';
import { Text } from 'react-native';

// WhatsApp-style inline formatting:
//   *bold*   _italic_   ~strikethrough~
// Markers must wrap non-empty text on a single line. Nesting works
// (e.g. *_bold italic_*) because each match is parsed recursively.
const PATTERN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

function renderParts(text, keyPrefix = '') {
  return text.split(PATTERN).map((part, i) => {
    const key = `${keyPrefix}${i}`;
    if (/^\*[^*\n]+\*$/.test(part)) {
      return <Text key={key} style={{ fontWeight: '700' }}>{renderParts(part.slice(1, -1), key + '-')}</Text>;
    }
    if (/^_[^_\n]+_$/.test(part)) {
      return <Text key={key} style={{ fontStyle: 'italic' }}>{renderParts(part.slice(1, -1), key + '-')}</Text>;
    }
    if (/^~[^~\n]+~$/.test(part)) {
      return <Text key={key} style={{ textDecorationLine: 'line-through' }}>{renderParts(part.slice(1, -1), key + '-')}</Text>;
    }
    return part;
  });
}

export default function FormattedText({ children, style, ...props }) {
  const text = typeof children === 'string' ? children : String(children ?? '');
  return (
    <Text style={style} {...props}>
      {renderParts(text)}
    </Text>
  );
}
