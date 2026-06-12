import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import { BIBLE_REF_REGEX, resolveRef } from '../utils/bibleRefs';

// WhatsApp-style inline formatting:
//   *bold*   _italic_   ~strikethrough~
// plus auto-linked Bible references ("Ayub 42:5") that open the Bible reader.
const STYLE_PATTERN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

// Turn plain text into segments, wrapping Bible references in tappable links.
function linkifyVerses(text, router, keyPrefix) {
  const out = [];
  let last = 0;
  let i = 0;
  BIBLE_REF_REGEX.lastIndex = 0;
  let m;
  while ((m = BIBLE_REF_REGEX.exec(text)) !== null) {
    const [full, book, chapter, verse] = m;
    const ref = resolveRef(book, chapter, verse);
    if (!ref) continue;

    // keep any leading non-word char captured by the pattern out of the link
    const lead = full.match(/^[^\w]/) ? full[0] : '';
    const refText = lead ? full.slice(1) : full;
    const start = m.index + lead.length;

    if (start > last) out.push(text.slice(last, start));
    out.push(
      <Text
        key={`${keyPrefix}v${i++}`}
        style={{ color: Colors.info, textDecorationLine: 'underline', fontWeight: '600' }}
        onPress={() =>
          router.push({
            pathname: '/bible/read',
            params: {
              chapterId: ref.chapterId,
              bookName: ref.bookName,
              chapterNum: ref.chapter,
              version: 'TSI',
              highlight: ref.verse,
            },
          })
        }
      >
        {refText}
      </Text>,
    );
    last = m.index + full.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderParts(text, router, keyPrefix = '') {
  return text.split(STYLE_PATTERN).map((part, i) => {
    const key = `${keyPrefix}${i}`;
    if (/^\*[^*\n]+\*$/.test(part)) {
      return <Text key={key} style={{ fontWeight: '700' }}>{renderParts(part.slice(1, -1), router, key + '-')}</Text>;
    }
    if (/^_[^_\n]+_$/.test(part)) {
      return <Text key={key} style={{ fontStyle: 'italic' }}>{renderParts(part.slice(1, -1), router, key + '-')}</Text>;
    }
    if (/^~[^~\n]+~$/.test(part)) {
      return <Text key={key} style={{ textDecorationLine: 'line-through' }}>{renderParts(part.slice(1, -1), router, key + '-')}</Text>;
    }
    return <React.Fragment key={key}>{linkifyVerses(part, router, key + '-')}</React.Fragment>;
  });
}

export default function FormattedText({ children, style, ...props }) {
  const router = useRouter();
  const text = typeof children === 'string' ? children : String(children ?? '');
  return (
    <Text style={style} {...props}>
      {renderParts(text, router)}
    </Text>
  );
}
