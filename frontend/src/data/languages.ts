// Comprehensive list of languages with their codes and metadata
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
  script?: string;
  commonCodes?: string[]; // Alternative codes used in subtitle filenames
}

// Simplified language type for filtering (commonCodes required)
export interface Language {
  code: string;
  name: string;
  nativeName?: string;
  commonCodes: string[];
}

export const COMPREHENSIVE_LANGUAGES: LanguageInfo[] = [
  // Major World Languages (with commonCodes for subtitle filename matching)
  { code: 'en', name: 'English', nativeName: 'English', commonCodes: ['en', 'eng', 'english'] },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', commonCodes: ['zh', 'zh-cn', 'zh-hans', 'zhs', 'chi', 'chinese', 'chs'] },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', commonCodes: ['zh-tw', 'zh-hk', 'zh-hant', 'zht', 'cht', 'tc', 'traditional'] },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', commonCodes: ['hi', 'hin', 'hindi'] },
  { code: 'es', name: 'Spanish', nativeName: 'Español', commonCodes: ['es', 'spa', 'spanish', 'espanol'] },
  { code: 'fr', name: 'French', nativeName: 'Français', commonCodes: ['fr', 'fre', 'fra', 'french', 'francais'] },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', commonCodes: ['ar', 'ara', 'arabic'] },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', commonCodes: ['bn', 'ben', 'bengali'] },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', commonCodes: ['pt', 'por', 'portuguese'] },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', commonCodes: ['ru', 'rus', 'russian'] },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', commonCodes: ['ja', 'jp', 'jpn', 'japanese'] },
  { code: 'de', name: 'German', nativeName: 'Deutsch', commonCodes: ['de', 'ger', 'deu', 'german', 'deutsch'] },
  { code: 'ko', name: 'Korean', nativeName: '한국어', commonCodes: ['ko', 'kr', 'kor', 'korean'] },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', commonCodes: ['it', 'ita', 'italian'] },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', commonCodes: ['tr', 'tur', 'turkish'] },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', commonCodes: ['vi', 'vie', 'vietnamese'] },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', commonCodes: ['pl', 'pol', 'polish'] },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', commonCodes: ['uk', 'ukr', 'ukrainian'] },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', commonCodes: ['nl', 'dut', 'nld', 'dutch'] },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', commonCodes: ['fa', 'per', 'fas', 'persian', 'farsi'] },

  // European Languages
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskera' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },

  // Asian Languages
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'dv', name: 'Maldivian', nativeName: 'ދިވެހި' },

  // Middle Eastern Languages
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },

  // African Languages
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  { code: 'om', name: 'Oromo', nativeName: 'Oromoo' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'zu', name: 'Zulu', nativeName: 'IsiZulu' },
  { code: 'xh', name: 'Xhosa', nativeName: 'IsiXhosa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },

  // Latin American Spanish variants
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)' },
  { code: 'es-CO', name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)' },
  { code: 'es-CL', name: 'Spanish (Chile)', nativeName: 'Español (Chile)' },
  { code: 'es-PE', name: 'Spanish (Peru)', nativeName: 'Español (Perú)' },
  { code: 'es-VE', name: 'Spanish (Venezuela)', nativeName: 'Español (Venezuela)' },

  // Portuguese variants
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)' },

  // English variants
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)' },

  // French variants
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)' },
  { code: 'fr-CH', name: 'French (Switzerland)', nativeName: 'Français (Suisse)' },
  { code: 'fr-BE', name: 'French (Belgium)', nativeName: 'Français (Belgique)' },

  // German variants
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)' },

  // Other regional variants
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)' },
  { code: 'ar-AE', name: 'Arabic (UAE)', nativeName: 'العربية (الإمارات)' },
  { code: 'ar-MA', name: 'Arabic (Morocco)', nativeName: 'العربية (المغرب)' },

  // Less common but still used
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Fakatonga' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti' },

  // Constructed languages
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto' },
  { code: 'ia', name: 'Interlingua', nativeName: 'Interlingua' },
  { code: 'vo', name: 'Volapük', nativeName: 'Volapük' },

  // Sign languages (using common codes)
  { code: 'asl', name: 'American Sign Language', nativeName: 'ASL' },
  { code: 'bsl', name: 'British Sign Language', nativeName: 'BSL' },
  { code: 'jsl', name: 'Japanese Sign Language', nativeName: 'JSL' },

  // Special/Technical
  { code: 'zxx', name: 'No Linguistic Content', nativeName: 'No Language' },
  { code: 'mul', name: 'Multiple Languages', nativeName: 'Multiple' },
  { code: 'und', name: 'Undetermined', nativeName: 'Unknown' },
];

// Common languages for quick selection (most frequently used)
export const COMMON_LANGUAGES = COMPREHENSIVE_LANGUAGES.filter(lang => 
  ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'tr', 'he'].includes(lang.code)
);

// Helper functions
export const getLanguageByCode = (code: string): LanguageInfo | undefined => {
  return COMPREHENSIVE_LANGUAGES.find(lang => lang.code === code);
};

export const searchLanguages = (query: string): LanguageInfo[] => {
  const lowercaseQuery = query.toLowerCase();
  return COMPREHENSIVE_LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(lowercaseQuery) ||
    lang.nativeName.toLowerCase().includes(lowercaseQuery) ||
    lang.code.toLowerCase().includes(lowercaseQuery)
  );
};

export const getLanguageDisplayName = (code: string): string => {
  const lang = getLanguageByCode(code);
  return lang ? `${lang.name} (${lang.code})` : code;
};

// Get language by code, checking commonCodes as well (case insensitive)
export const getLanguageByCommonCode = (code: string): LanguageInfo | undefined => {
  const normalizedCode = code.toLowerCase().trim();
  return COMPREHENSIVE_LANGUAGES.find(lang =>
    lang.code.toLowerCase() === normalizedCode ||
    lang.commonCodes?.some(c => c.toLowerCase() === normalizedCode)
  );
};

// Extract language codes from a filename
export const extractLanguageFromFilename = (filename: string): LanguageInfo[] => {
  const foundLanguages: LanguageInfo[] = [];
  const normalizedFilename = filename.toLowerCase();

  const parts = normalizedFilename.split('.');

  for (const part of parts) {
    // Skip common non-language parts
    if (part.match(/^(srt|ass|vtt|sub|idx|ssa|txt|s\d+e\d+|\d+x\d+)$/)) {
      continue;
    }

    const language = getLanguageByCommonCode(part);
    if (language && !foundLanguages.find(l => l.code === language.code)) {
      foundLanguages.push(language);
    }
  }

  return foundLanguages;
};

// Check if a filename contains specific language codes
export const filenameContainsLanguages = (filename: string, languageCodes: string[]): boolean => {
  const detectedLanguages = extractLanguageFromFilename(filename);
  const detectedCodes = detectedLanguages.map(l => l.code);

  return languageCodes.every(code =>
    detectedCodes.includes(code) ||
    detectedLanguages.some(lang => lang.commonCodes?.includes(code.toLowerCase()))
  );
};

// Alias for backwards compatibility - LANGUAGES points to COMPREHENSIVE_LANGUAGES
export const LANGUAGES = COMPREHENSIVE_LANGUAGES;

// Languages with commonCodes for filtering (used by LanguageFilter component)
export const FILTER_LANGUAGES: Language[] = COMPREHENSIVE_LANGUAGES
  .filter(lang => lang.commonCodes && lang.commonCodes.length > 0)
  .map(lang => ({
    code: lang.code,
    name: lang.name,
    nativeName: lang.nativeName,
    commonCodes: lang.commonCodes!,
  }));

// Get display name for a Language object (used by LanguageFilter)
export const getLanguageDisplayNameFromLanguage = (language: Language): string => {
  return language.nativeName ? `${language.name} (${language.nativeName})` : language.name;
};