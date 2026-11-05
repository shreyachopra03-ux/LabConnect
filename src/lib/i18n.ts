import { cookies } from "next/headers";

export const LANGS = ["en", "te", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { en: "English", te: "తెలుగు", hi: "हिंदी" };
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  return isLang(c) ? c : "en";
}

const dict = {
  brand: { en: "Company A Diagnostics", te: "Company A Diagnostics", hi: "Company A Diagnostics" },
  loginTitle: { en: "See your lab reports", te: "మీ ల్యాబ్ రిపోర్టులు చూడండి", hi: "अपनी लैब रिपोर्ट देखें" },
  loginHint: {
    en: "Enter the mobile number you gave at the lab.",
    te: "ల్యాబ్‌లో మీరు ఇచ్చిన మొబైల్ నంబర్ నమోదు చేయండి.",
    hi: "लैब में दिया गया मोबाइल नंबर डालें।",
  },
  mobileLabel: { en: "Mobile number", te: "మొబైల్ నంబర్", hi: "मोबाइल नंबर" },
  sendCode: { en: "Send code", te: "కోడ్ పంపండి", hi: "कोड भेजें" },
  invalidMobile: {
    en: "Please enter a valid 10-digit mobile number.",
    te: "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
    hi: "कृपया सही 10 अंकों का मोबाइल नंबर डालें।",
  },
  otpTitle: { en: "Enter the 6-digit code", te: "6 అంకెల కోడ్ నమోదు చేయండి", hi: "6 अंकों का कोड डालें" },
  otpSentTo: {
    en: "We sent a code by SMS to {m}.",
    te: "{m} కు SMS ద్వారా కోడ్ పంపాము.",
    hi: "हमने {m} पर SMS से कोड भेजा है।",
  },
  continue: { en: "Continue", te: "కొనసాగించండి", hi: "आगे बढ़ें" },
  resend: { en: "Send the code again", te: "కోడ్ మళ్ళీ పంపండి", hi: "कोड फिर से भेजें" },
  changeNumber: { en: "Change number", te: "నంబర్ మార్చండి", hi: "नंबर बदलें" },
  otpFormat: {
    en: "Please enter all 6 digits of the code.",
    te: "దయచేసి కోడ్‌లోని 6 అంకెలూ నమోదు చేయండి.",
    hi: "कृपया कोड के सभी 6 अंक डालें।",
  },
  otpInvalid: {
    en: "That code is not correct. Please try again.",
    te: "ఆ కోడ్ సరైనది కాదు. మళ్ళీ ప్రయత్నించండి.",
    hi: "यह कोड सही नहीं है। फिर से कोशिश करें।",
  },
  otpExpired: {
    en: "This code has expired. Please ask for a new one.",
    te: "ఈ కోడ్ గడువు ముగిసింది. కొత్త కోడ్ అడగండి.",
    hi: "इस कोड का समय खत्म हो गया है। नया कोड मँगाएँ।",
  },
  otpLocked: {
    en: "Too many tries. Please ask for a new code.",
    te: "చాలా సార్లు ప్రయత్నించారు. కొత్త కోడ్ అడగండి.",
    hi: "बहुत बार कोशिश हुई। कृपया नया कोड मँगाएँ।",
  },
  rateLimited: {
    en: "Too many codes requested. Please wait 10 minutes.",
    te: "చాలా కోడ్‌లు అడిగారు. దయచేసి 10 నిమిషాలు ఆగండి.",
    hi: "बहुत सारे कोड माँगे गए। कृपया 10 मिनट रुकें।",
  },
  consentTitle: { en: "Before you continue", te: "కొనసాగే ముందు", hi: "आगे बढ़ने से पहले" },
  consentBody: {
    en: "We keep your lab reports safely in India. We use them only to share results with you and your doctor. Every time a report is opened, we record it. You can ask us to stop at any time.",
    te: "మీ ల్యాబ్ రిపోర్టులను మేము భారతదేశంలో సురక్షితంగా ఉంచుతాము. వాటిని మీకు మరియు మీ డాక్టర్‌కు ఫలితాలు అందించడానికి మాత్రమే ఉపయోగిస్తాము. రిపోర్ట్ తెరిచిన ప్రతిసారీ నమోదు చేస్తాము. మీరు ఎప్పుడైనా ఆపమని కోరవచ్చు.",
    hi: "हम आपकी लैब रिपोर्ट भारत में सुरक्षित रखते हैं। इनका उपयोग केवल आपको और आपके डॉक्टर को परिणाम देने के लिए करते हैं। हर बार रिपोर्ट खुलने पर हम उसे दर्ज करते हैं। आप कभी भी इसे रोकने के लिए कह सकते हैं।",
  },
  consentFamily: {
    en: "Reports of everyone registered with this number will be shown.",
    te: "ఈ నంబర్‌తో నమోదైన అందరి రిపోర్టులు చూపబడతాయి.",
    hi: "इस नंबर से जुड़े सभी लोगों की रिपोर्ट दिखाई जाएँगी।",
  },
  consentAgree: { en: "I agree", te: "నేను అంగీకరిస్తున్నాను", hi: "मैं सहमत हूँ" },
  reportsTitle: { en: "Your reports", te: "మీ రిపోర్టులు", hi: "आपकी रिपोर्ट" },
  noReports: {
    en: "There are no reports for this number yet.",
    te: "ఈ నంబర్‌కు ఇంకా రిపోర్టులు లేవు.",
    hi: "इस नंबर पर अभी कोई रिपोर्ट नहीं है।",
  },
  statusReady: { en: "Ready", te: "సిద్ధంగా ఉంది", hi: "तैयार है" },
  statusProcessing: { en: "Being tested", te: "పరీక్ష జరుగుతోంది", hi: "जाँच चल रही है" },
  processingHint: {
    en: "We will send you a WhatsApp message when it is ready. No need to call.",
    te: "సిద్ధమైనప్పుడు మీకు WhatsApp సందేశం పంపుతాము. ఫోన్ చేయనవసరం లేదు.",
    hi: "तैयार होने पर हम आपको WhatsApp संदेश भेजेंगे। फ़ोन करने की ज़रूरत नहीं।",
  },
  viewReport: { en: "View report", te: "రిపోర్ట్ చూడండి", hi: "रिपोर्ट देखें" },
  downloadPdf: { en: "Download full report (PDF)", te: "పూర్తి రిపోర్ట్ డౌన్‌లోడ్ (PDF)", hi: "पूरी रिपोर्ट डाउनलोड करें (PDF)" },
  doctor: { en: "Doctor", te: "డాక్టర్", hi: "डॉक्टर" },
  summaryTitle: { en: "In simple words", te: "సులభమైన మాటల్లో", hi: "आसान शब्दों में" },
  allNormal: {
    en: "All your results are within the normal range.",
    te: "మీ ఫలితాలన్నీ సాధారణ పరిధిలో ఉన్నాయి.",
    hi: "आपके सभी परिणाम सामान्य सीमा में हैं।",
  },
  disclaimer: {
    en: "This is a simple guide, not a diagnosis. Please show the full report to your doctor.",
    te: "ఇది సులభమైన వివరణ మాత్రమే, రోగ నిర్ధారణ కాదు. దయచేసి పూర్తి రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.",
    hi: "यह केवल आसान जानकारी है, निदान नहीं। कृपया पूरी रिपोर्ट अपने डॉक्टर को दिखाएँ।",
  },
  criticalTitle: { en: "Our team will call you", te: "మా సిబ్బంది మీకు ఫోన్ చేస్తారు", hi: "हमारी टीम आपको फ़ोन करेगी" },
  criticalBody: {
    en: "One result in this report needs a doctor's attention soon. Our team will call you shortly. Please keep your phone nearby.",
    te: "ఈ రిపోర్ట్‌లో ఒక ఫలితాన్ని డాక్టర్ త్వరగా చూడాలి. మా సిబ్బంది త్వరలో మీకు ఫోన్ చేస్తారు. దయచేసి మీ ఫోన్ దగ్గర ఉంచుకోండి.",
    hi: "इस रिपोर्ट के एक परिणाम पर डॉक्टर को जल्द ध्यान देना ज़रूरी है। हमारी टीम आपको जल्द ही फ़ोन करेगी। कृपया अपना फ़ोन पास रखें।",
  },
  results: { en: "All results", te: "అన్ని ఫలితాలు", hi: "सभी परिणाम" },
  normalRange: { en: "Normal", te: "సాధారణం", hi: "सामान्य" },
  flagHIGH: { en: "High", te: "ఎక్కువ", hi: "अधिक" },
  flagLOW: { en: "Low", te: "తక్కువ", hi: "कम" },
  flagNORMAL: { en: "Normal", te: "సాధారణం", hi: "सामान्य" },
  flagUNKNOWN: { en: "See report", te: "రిపోర్ట్ చూడండి", hi: "रिपोर्ट देखें" },
  flagPrompt: { en: "Does this explanation look wrong?", te: "ఈ వివరణ తప్పుగా ఉందా?", hi: "क्या यह जानकारी गलत लगती है?" },
  flagButton: { en: "Tell us", te: "మాకు తెలపండి", hi: "हमें बताएँ" },
  flagThanks: {
    en: "Thank you. A pathologist will check this explanation.",
    te: "ధన్యవాదాలు. పాథాలజిస్ట్ ఈ వివరణను పరిశీలిస్తారు.",
    hi: "धन्यवाद। पैथोलॉजिस्ट इस जानकारी की जाँच करेंगे।",
  },
  linkReadyTitle: { en: "Your report is ready", te: "మీ రిపోర్ట్ సిద్ధంగా ఉంది", hi: "आपकी रिपोर्ट तैयार है" },
  linkReadyBody: {
    en: "Tap the button to open it. This link is only for the person it was sent to.",
    te: "తెరవడానికి బటన్ నొక్కండి. ఈ లింక్ ఎవరికి పంపామో వారికి మాత్రమే.",
    hi: "खोलने के लिए बटन दबाएँ। यह लिंक केवल उसी व्यक्ति के लिए है जिसे भेजा गया है।",
  },
  openReport: { en: "Open report", te: "రిపోర్ట్ తెరవండి", hi: "रिपोर्ट खोलें" },
  linkExpiredTitle: { en: "This link has expired", te: "ఈ లింక్ గడువు ముగిసింది", hi: "इस लिंक का समय खत्म हो गया है" },
  linkExpiredBody: {
    en: "For your safety, report links work for 72 hours. We can send a code to {m} to open it again.",
    te: "మీ భద్రత కోసం రిపోర్ట్ లింకులు 72 గంటలు మాత్రమే పనిచేస్తాయి. మళ్ళీ తెరవడానికి {m} కు కోడ్ పంపగలము.",
    hi: "आपकी सुरक्षा के लिए रिपोर्ट लिंक 72 घंटे तक ही चलते हैं। दोबारा खोलने के लिए हम {m} पर कोड भेज सकते हैं।",
  },
  linkInvalidTitle: { en: "This link does not work", te: "ఈ లింక్ పనిచేయదు", hi: "यह लिंक काम नहीं करता" },
  linkInvalidBody: {
    en: "A newer link may have been sent. Log in with your mobile number to see your reports.",
    te: "కొత్త లింక్ పంపి ఉండవచ్చు. మీ రిపోర్టులు చూడటానికి మొబైల్ నంబర్‌తో లాగిన్ అవ్వండి.",
    hi: "शायद नया लिंक भेजा गया है। अपनी रिपोर्ट देखने के लिए मोबाइल नंबर से लॉगिन करें।",
  },
  login: { en: "Log in", te: "లాగిన్", hi: "लॉगिन" },
  logout: { en: "Log out", te: "లాగ్ అవుట్", hi: "लॉग आउट" },
  allReports: { en: "All reports", te: "అన్ని రిపోర్టులు", hi: "सभी रिपोर्ट" },
  seeAllReports: {
    en: "See all reports for this number",
    te: "ఈ నంబర్ యొక్క అన్ని రిపోర్టులు చూడండి",
    hi: "इस नंबर की सभी रिपोर्ट देखें",
  },
  help: { en: "Need help? Call {p}", te: "సహాయం కావాలా? {p} కు ఫోన్ చేయండి", hi: "मदद चाहिए? {p} पर फ़ोन करें" },
} satisfies Record<string, Record<Lang, string>>;

export type MsgKey = keyof typeof dict;

export function t(lang: Lang, key: MsgKey, vars?: Record<string, string>): string {
  let s: string = dict[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

const LOCALE: Record<Lang, string> = { en: "en-IN", te: "te-IN", hi: "hi-IN" };
export const formatDate = (d: Date, lang: Lang) =>
  d.toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
