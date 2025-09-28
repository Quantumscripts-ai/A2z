// API Endpoints
export const API_ENDPOINTS = {
  AUTH: "/api/auth",
  USERS: "/api/users",
  SUBTITLES: "/api/subtitles",
  BILLING: "/api/billing",
  INTEGRATIONS: "/api/integrations",
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: "TranslateA2Z",
  APP_TAGLINE: "AI-Powered Video Subtitle Generation",
  SUPPORT_EMAIL: "support@TranslateA2Z.com",
  WEBSITE_URL: "https://TranslateA2Z.com",
};

// Storage Keys
export const STORAGE_KEYS = {
  THEME: "TranslateA2Z_theme",
  SIDEBAR_COLLAPSED: "TranslateA2Z_sidebar_collapsed",
  USER_PREFERENCES: "TranslateA2Z_user_preferences",
};

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH_EXPANDED: 256, // 64 * 4 = 256px (w-64)
  SIDEBAR_WIDTH_COLLAPSED: 64, // 16 * 4 = 64px (w-16)
  NAVBAR_HEIGHT: 80, // 20 * 4 = 80px (pt-20)
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_VIDEO_FORMATS: [
    "mp4",
    "mov",
    "avi",
    "wmv",
    "flv",
    "mkv",
    "webm",
    "mp3",
    "m4a",
    "wav",
    "aac",
  ],
};

// Supported Languages for Subtitle Generation
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "fil", name: "Filipino", flag: "🇵🇭" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "sk", name: "Slovak", flag: "🇸🇰" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "bg", name: "Bulgarian", flag: "🇧🇬" },
  { code: "hr", name: "Croatian", flag: "🇭🇷" },
  { code: "sl", name: "Slovenian", flag: "🇸🇮" },
  { code: "et", name: "Estonian", flag: "🇪🇪" },
  { code: "lv", name: "Latvian", flag: "🇱🇻" },
  { code: "lt", name: "Lithuanian", flag: "🇱🇹" },
  { code: "mt", name: "Maltese", flag: "🇲🇹" },
  { code: "ga", name: "Irish", flag: "🇮🇪" },
  { code: "cy", name: "Welsh", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "eu", name: "Basque", flag: "🇪🇸" },
  { code: "ca", name: "Catalan", flag: "🇪🇸" },
  { code: "gl", name: "Galician", flag: "🇪🇸" },
];

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  NA: {
    name: "No Plan",
    price: 0,
    videos_per_month: 0,
    storage_mb: 0,
    credits: 0,
    features: ["No access to features", "Must purchase a plan to continue"],
    monthlyUrl: "",
    yearlyUrl: "",
  },
  STANDARD: {
    name: "Standard",
    price: 15,
    videos_per_month: 5,
    storage_mb: 500,
    credits: 100,
    features: [
      "Basic subtitle generation",
      "Standard support",
      "SRT export",
      "100 credits included",
    ],
    monthlyUrl:
      "https://labs.jayasim.com/web/checkout/689c119b2817360599a07dee",
    yearlyUrl: "https://labs.jayasim.com/web/checkout/68b99dc209c7852f7a7439d5",
  },
  PRO: {
    name: "Pro",
    price: 29,
    videos_per_month: 100,
    storage_mb: 10000,
    credits: 250,
    features: [
      "Advanced AI models",
      "Priority support",
      "Multiple formats",
      "Custom styling",
      "250 credits included",
    ],
    monthlyUrl:
      "https://labs.jayasim.com/web/checkout/689c119b2817360599a07dee",
    yearlyUrl: "https://labs.jayasim.com/web/checkout/68b99dc209c7852f7a7439d5",
  },
  BUSINESS: {
    name: "Business",
    price: 99,
    videos_per_month: 1000,
    storage_mb: 50000,
    credits: 600,
    features: [
      "Team collaboration",
      "API access",
      "White-label",
      "Custom integrations",
      "600 credits included",
    ],
    monthlyUrl:
      "https://labs.jayasim.com/web/checkout/689c119b2817360599a07dee",
    yearlyUrl: "https://labs.jayasim.com/web/checkout/68b99dc209c7852f7a7439d5",
  },
  CUSTOM: {
    name: "Fast Hours",
    price: null,
    videos_per_month: null,
    storage_mb: null,
    credits: null,
    features: [
      "Custom credit amount",
      "Pay as you go",
      "All Pro features",
      "Priority support",
      "Custom pricing",
    ],
    customUrl: "https://labs.jayasim.com/web/checkout/68b99cdc1a96602f1c75f65f",
  },
};

// Theme Colors
export const THEME_COLORS = {
  DARK: {
    PRIMARY: "rgb(147, 51, 234)", // purple-600
    SECONDARY: "rgb(59, 130, 246)", // blue-500
    BACKGROUND: "rgb(0, 0, 0)", // black
    SURFACE: "rgba(0, 0, 0, 0.5)", // black/50
    TEXT_PRIMARY: "rgb(255, 255, 255)", // white
    TEXT_SECONDARY: "rgb(156, 163, 175)", // gray-400
    BORDER: "rgb(55, 65, 81)", // gray-700
  },
  LIGHT: {
    PRIMARY: "rgb(147, 51, 234)", // purple-600
    SECONDARY: "rgb(59, 130, 246)", // blue-500
    BACKGROUND: "rgb(255, 255, 255)", // white
    SURFACE: "rgba(255, 255, 255, 0.5)", // white/50
    TEXT_PRIMARY: "rgb(17, 24, 39)", // gray-900
    TEXT_SECONDARY: "rgb(107, 114, 128)", // gray-500
    BORDER: "rgb(209, 213, 219)", // gray-300
  },
};

// Animation Durations
export const ANIMATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  MAX_FILE_NAME_LENGTH: 255,
};
