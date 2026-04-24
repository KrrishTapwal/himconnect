// Content moderation filter — blocks abuse, 18+, violence, spam

const BAD_WORDS_EN = [
  'fuck', 'f**k', 'fuk', 'fuq', 'fvck', 'shit', 'sh!t', 'sh1t', 'bitch', 'b1tch',
  'bastard', 'asshole', 'ass hole', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'retard', 'motherfucker', 'motherfuck',
  'rape', 'raping', 'raped', 'rapist', 'kill yourself', 'kys',
  'porn', 'porno', 'nude', 'nudes', 'naked', 'xxx', 'boob', 'boobs',
  'penis', 'vagina', 'blowjob', 'handjob', 'orgasm', 'masturbat',
  'cocaine', 'heroin', 'buy drugs', 'weed dealer',
];

// Hindi abuse (Devanagari + transliteration)
const BAD_WORDS_HI = [
  // Devanagari
  'मादरचोद', 'भड़वा', 'भड़वे', 'रंडी', 'रांड', 'चूतिया', 'चूत', 'लंड', 'लौड़ा',
  'हरामी', 'हरामजादा', 'हरामजादे', 'कमीना', 'कमीने', 'गांडू', 'गांड',
  'बकचोद', 'बेहेनचोद', 'बेहनचोद', 'भोसड़ी', 'टट्टी', 'मुतना',
  // Transliteration — kept specific, removed short substrings like 'rand', 'saala', 'chinar'
  'madarchod', 'madarcho', 'bhadwa', 'bhadwe', 'randi', 'chutiya',
  'lauda', 'harami', 'haramzada', 'haramzade', 'kamina', 'kamine',
  'gandu', 'gaand', 'bakchod', 'behenchod', 'behen chod', 'bhosdi', 'bhosad',
  'tatti', 'teri maa', 'teri behen', 'beti randi', 'chinaal',
];

// 18+ explicit keywords
const ADULT_WORDS = [
  'onlyfans', 'only fans', 'camgirl', 'escort', 'call girl', 'hookup', 'hook up',
  'one night stand', 'nsfw', 'adult content',
];

// Violence / threat keywords (phrases only — avoids blocking normal words)
const VIOLENCE_WORDS = [
  'i will kill', "i'll kill", 'gonna kill', 'will shoot', 'will stab',
  'bomb threat', 'death threat', 'beat up', 'kill yourself',
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[$5]/g, 's')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/\*/g, '')
    .replace(/[-_.]/g, ' ');
}

function isDevanagari(text) {
  return /[ऀ-ॿ]/.test(text);
}

function matchesBadWord(combined, word) {
  const norm = normalize(word);
  if (isDevanagari(norm) || norm.includes(' ') || norm.length <= 3) {
    // Phrases and Devanagari: simple substring match is fine
    return combined.includes(norm);
  }
  // Latin single words: use word boundary to avoid false positives
  // e.g. 'kill' won't match 'skill', 'lund' won't match 'blunder'
  const escaped = norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}`).test(combined);
}

function isMeaningless(text) {
  const t = text.trim();
  if (t.length < 5) return true;
  if (/^[^a-zA-Zऀ-ॿ]+$/.test(t)) return true;
  if (/^(.)\1{4,}$/.test(t.replace(/\s/g, ''))) return true;
  const words = t.split(/\s+/);
  const gibberish = words.filter(w => w.length > 4 && !/[aeiouAEIOUऀ-ॿ]/.test(w));
  if (gibberish.length > 0 && gibberish.length / words.length > 0.6) return true;
  return false;
}

function checkContent(title = '', body = '') {
  const combined = normalize(`${title} ${body}`);

  const ALL_BAD = [...BAD_WORDS_EN, ...BAD_WORDS_HI, ...ADULT_WORDS, ...VIOLENCE_WORDS];
  for (const word of ALL_BAD) {
    if (matchesBadWord(combined, word)) {
      return { blocked: true, reason: 'abusive_language', word };
    }
  }

  if (isMeaningless(title) && isMeaningless(body)) {
    return { blocked: true, reason: 'meaningless' };
  }

  return { blocked: false };
}

module.exports = { checkContent };
