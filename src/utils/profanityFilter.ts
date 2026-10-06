/**
 * Thai & English Profanity Filter and Moderation Engine
 */

// Normalized lists of Thai and English profane/vulgar keywords
const THAI_PROFANITY_ROOTS = [
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ดอกทอง', 'ส้นตีน', 'อีเหี้ย', 'ไอ้เหี้ย',
  'ชาติชั่ว', 'หน้าด้าน', 'ระยำ', 'จังไร', 'สันดาน', 'ชิบหาย', 'ฉิบหาย', 'แรด',
  'อีกะหรี่', 'กะหรี่', 'สถุล', 'อีดอก', 'ไอ้สัตว์', 'สัตว์นรก', 'แม่ง', 'เสือก',
  'ห่า', 'หี', 'แตด', 'ดักดาน', 'โง่เง่า', 'เสนียด'
];

const ENGLISH_PROFANITY_ROOTS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'motherfucker', 'whore', 'slut', 'nigger', 'faggot', 'cock', 'fucker'
];

// Patterns for variations and bypass tricks (like ค-ว-ย, สั-ส, f*ck, sh!t)
const BYPASS_PATTERNS = [
  /ค[\s\-_.*+~]*ว[\s\-_.*+~]*ย/gi,
  /เหี้[\s\-_.*+~]*ย/gi,
  /สั[\s\-_.*+~]*ส/gi,
  /เย็[\s\-_.*+~]*ด/gi,
  /ส้[\s\-_.*+~]*น[\s\-_.*+~]*ตี[\s\-_.*+~]*น/gi,
  /ด[\s\-_.*+~]*อ[\s\-_.*+~]*ก[\s\-_.*+~]*ท[\s\-_.*+~]*อ[\s\-_.*+~]*ง/gi,
  /f[\s\-_.*+~]*u[\s\-_.*+~]*c[\s\-_.*+~]*k/gi,
  /s[\s\-_.*+~]*h[\s\-_.*+~]*i[\s\-_.*+~]*t/gi,
  /b[\s\-_.*+~]*i[\s\-_.*+~]*t[\s\-_.*+~]*c[\s\-_.*+~]*h/gi,
  /a[\s\-_.*+~]*s[\s\-_.*+~]*s[\s\-_.*+~]*h[\s\-_.*+~]*o[\s\-_.*+~]*l[\s\-_.*+~]*e/gi,
];

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  matchedWords: string[];
  cleanText: string;
}

/**
 * Normalizes text to detect obfuscated profanity
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0o]/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');
}

/**
 * Checks text for profanity and returns matched words and censored version
 */
export function checkProfanity(text: string): ProfanityCheckResult {
  if (!text || typeof text !== 'string') {
    return { hasProfanity: false, matchedWords: [], cleanText: text || '' };
  }

  const matched = new Set<string>();
  let cleanText = text;
  const normalized = normalizeText(text);

  // 1. Check Thai profanity roots
  for (const word of THAI_PROFANITY_ROOTS) {
    const regex = new RegExp(word, 'gi');
    if (regex.test(text)) {
      matched.add(word);
      cleanText = cleanText.replace(regex, (match) => '*'.repeat(match.length));
    }
  }

  // 2. Check English profanity roots
  for (const word of ENGLISH_PROFANITY_ROOTS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(normalized)) {
      matched.add(word);
      // replace in original text
      const origRegex = new RegExp(word, 'gi');
      cleanText = cleanText.replace(origRegex, (match) => '*'.repeat(match.length));
    }
  }

  // 3. Check bypass regex patterns
  for (const pattern of BYPASS_PATTERNS) {
    if (pattern.test(text)) {
      matched.add('คำหยาบแบบดัดแปลง');
      cleanText = cleanText.replace(pattern, '***');
    }
  }

  return {
    hasProfanity: matched.size > 0,
    matchedWords: Array.from(matched),
    cleanText,
  };
}

/**
 * Validates group name or description before creating / updating
 */
export function validateGroupName(name: string): { isValid: boolean; errorReason?: string } {
  const result = checkProfanity(name);
  if (result.hasProfanity) {
    return {
      isValid: false,
      errorReason: `ชื่อกลุ่มมีคำที่ไม่เหมาะสม (${result.matchedWords.join(', ')}) กรุณาใช้ชื่อที่สุภาพ`,
    };
  }
  return { isValid: true };
}

/**
 * GuardBot Profile Constant
 */
export const GUARDBOT_USER = {
  id: 'bot_guard_moderator',
  displayName: 'GuardBot (บอทตรวจคำหยาบ)',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuardBot&backgroundColor=b6e3f4',
  status: 'online' as const,
  email: 'guardbot@collabsphere.system',
};
