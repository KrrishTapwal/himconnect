// Content moderation filter — blocks abuse, 18+, violence, spam

const BAD_WORDS_EN = [
  'fuck', 'f**k', 'fuk', 'fuq', 'fvck', 'shit', 'sh!t', 'sh1t', 'bitch', 'b1tch',
  'bastard', 'asshole', 'ass hole', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'retard', 'motherfucker', 'motherfuck', 'wtf', 'stfu',
  'rape', 'raping', 'raped', 'rapist', 'kill yourself', 'kys', 'kys',
  'sex', 'sexy', 'porn', 'porno', 'nude', 'nudes', 'naked', 'xxx', 'boob', 'boobs',
  'penis', 'vagina', 'blowjob', 'handjob', 'orgasm', 'masturbat',
  'terrorist', 'bomb', 'suicide', 'kill', 'murder', 'shoot', 'stab',
  'drug', 'cocaine', 'heroin', 'weed dealer', 'buy drugs',
];

// Hindi abuse (Devanagari + transliteration)
const BAD_WORDS_HI = [
  // Devanagari
  'मादरचोद', 'भड़वा', 'भड़वे', 'रंडी', 'रांड', 'चूतिया', 'चूत', 'लंड', 'लौड़ा',
  'हरामी', 'हरामजादा', 'हरामजादे', 'कमीना', 'कमीने', 'गांडू', 'गांड', 'साला',
  'बकचोद', 'बेहेनचोद', 'बेहनचोद', 'भोसड़ी', 'टट्टी', 'मुतना',
  // Transliteration
  'madarchod', 'madarcho', 'bhadwa', 'bhadwe', 'randi', 'rand', 'chutiya', 'chut',
  'lund', 'lauda', 'harami', 'haramzada', 'haramzade', 'kamina', 'kamine',
  'gandu', 'gaand', 'bakchod', 'behenchod', 'behen chod', 'bhosdi', 'bhosad',
  'tatti', 'maa ki', 'teri maa', 'teri behen', 'beti randi',
  'chinar', 'chinaal', 'saala', 'saali',
];

// 18+ explicit keywords
const ADULT_WORDS = [
  'onlyfans', 'only fans', 'camgirl', 'escort', 'call girl', 'hookup', 'hook up',
  'one night stand', 'no string', 'nsfw', 'adult content', '18+',
];

// Violence / threat keywords
const VIOLENCE_WORDS = [
  'i will kill', "i'll kill", 'gonna kill', 'will shoot', 'will stab',
  'bomb threat', 'death threat', 'torture', 'beat up',
];

const ALL_BAD = [
  ...BAD_WORDS_EN,
  ...BAD_WORDS_HI,
  ...ADULT_WORDS,
  ...VIOLENCE_WORDS,
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

function isMeaningless(text) {
  const t = text.trim();
  if (t.length < 5) return true;
  // only punctuation / numbers
  if (/^[^a-zA-Zऀ-ॿ]+$/.test(t)) return true;
  // same character repeated (aaaaa, hahaha etc but allow 'haha' and common)
  if (/^(.)\1{4,}$/.test(t.replace(/\s/g, ''))) return true;
  // random keyboard mash (no vowels for long stretches)
  const words = t.split(/\s+/);
  const gibberish = words.filter(w => w.length > 4 && !/[aeiouAEIOUऀ-ॿ]/.test(w));
  if (gibberish.length > 0 && gibberish.length / words.length > 0.6) return true;
  return false;
}

function checkContent(title = '', body = '') {
  const combined = normalize(`${title} ${body}`);

  for (const word of ALL_BAD) {
    const norm = normalize(word);
    if (combined.includes(norm)) {
      return { blocked: true, reason: 'abusive_language', word };
    }
  }

  if (isMeaningless(title) && isMeaningless(body)) {
    return { blocked: true, reason: 'meaningless' };
  }

  return { blocked: false };
}

module.exports = { checkContent };
