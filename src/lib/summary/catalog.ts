/**
 * Locked, pathologist-approved templates for common tests. Text here is reviewed
 * once and never generated at runtime. The brief targets the 30 most common tests;
 * this demo ships 10, and the shape is the same for the rest.
 */
export type L = { en: string; te: string; hi: string };

export type TestEntry = {
  key: string;
  aliases: string[];
  name: L;
  low?: L;
  high?: L;
};

export const CATALOG: TestEntry[] = [
  {
    key: "haemoglobin",
    aliases: ["haemoglobin", "hemoglobin", "hb", "hgb"],
    name: { en: "haemoglobin", te: "హిమోగ్లోబిన్", hi: "हीमोग्लोबिन" },
    low: {
      en: "Low haemoglobin (anaemia) can make you feel tired or breathless. It is often due to low iron.",
      te: "హిమోగ్లోబిన్ తక్కువగా ఉంటే (రక్తహీనత) అలసట లేదా ఆయాసం రావచ్చు. ఇది తరచుగా ఐరన్ లోపం వల్ల జరుగుతుంది.",
      hi: "हीमोग्लोबिन कम होने (खून की कमी) से थकान या साँस फूल सकती है। यह अक्सर आयरन की कमी से होता है।",
    },
    high: {
      en: "High haemoglobin can be due to dehydration, smoking or other causes.",
      te: "హిమోగ్లోబిన్ ఎక్కువగా ఉండటానికి శరీరంలో నీరు తగ్గడం, ధూమపానం లేదా ఇతర కారణాలు ఉండవచ్చు.",
      hi: "हीमोग्लोबिन अधिक होने का कारण पानी की कमी, धूम्रपान या अन्य कारण हो सकते हैं।",
    },
  },
  {
    key: "ldl",
    aliases: ["ldl", "ldl cholesterol", "ldl c", "ldl-c"],
    name: { en: "LDL (bad) cholesterol", te: "LDL (చెడు) కొలెస్ట్రాల్", hi: "LDL (खराब) कोलेस्ट्रॉल" },
    high: {
      en: "High LDL raises the risk of heart disease over time. Food, exercise and sometimes medicine help.",
      te: "LDL ఎక్కువగా ఉంటే కాలక్రమేణా గుండె జబ్బుల ప్రమాదం పెరుగుతుంది. ఆహారం, వ్యాయామం, అవసరమైతే మందులు సహాయపడతాయి.",
      hi: "LDL अधिक होने से समय के साथ दिल की बीमारी का खतरा बढ़ता है। खान-पान, व्यायाम और ज़रूरत हो तो दवा से मदद मिलती है।",
    },
  },
  {
    key: "total_cholesterol",
    aliases: ["total cholesterol", "cholesterol", "cholesterol total"],
    name: { en: "total cholesterol", te: "మొత్తం కొలెస్ట్రాల్", hi: "कुल कोलेस्ट्रॉल" },
    high: {
      en: "High cholesterol raises the risk of heart disease over time.",
      te: "కొలెస్ట్రాల్ ఎక్కువగా ఉంటే కాలక్రమేణా గుండె జబ్బుల ప్రమాదం పెరుగుతుంది.",
      hi: "कोलेस्ट्रॉल अधिक होने से समय के साथ दिल की बीमारी का खतरा बढ़ता है।",
    },
  },
  {
    key: "potassium",
    aliases: ["potassium", "k", "serum potassium"],
    name: { en: "potassium", te: "పొటాషియం", hi: "पोटैशियम" },
    low: {
      en: "Low potassium can cause weakness or muscle cramps.",
      te: "పొటాషియం తక్కువగా ఉంటే బలహీనత లేదా కండరాల తిమ్మిరి రావచ్చు.",
      hi: "पोटैशियम कम होने से कमजोरी या मांसपेशियों में ऐंठन हो सकती है।",
    },
    high: {
      en: "High potassium can affect the heartbeat.",
      te: "పొటాషియం ఎక్కువగా ఉంటే గుండె కొట్టుకోవడంపై ప్రభావం ఉండవచ్చు.",
      hi: "पोटैशियम अधिक होने से दिल की धड़कन पर असर पड़ सकता है।",
    },
  },
  {
    key: "glucose_fasting",
    aliases: ["glucose fasting", "fasting glucose", "fasting blood sugar", "fbs", "blood sugar fasting"],
    name: { en: "fasting blood sugar", te: "పరగడుపు రక్తంలో చక్కెర", hi: "खाली पेट ब्लड शुगर" },
    low: {
      en: "Low sugar can cause shaking, sweating or dizziness.",
      te: "చక్కెర తక్కువగా ఉంటే వణుకు, చెమట లేదా తల తిరగడం రావచ్చు.",
      hi: "शुगर कम होने से कंपकंपी, पसीना या चक्कर आ सकते हैं।",
    },
    high: {
      en: "High fasting sugar can be a sign of diabetes or pre-diabetes.",
      te: "పరగడుపున చక్కెర ఎక్కువగా ఉంటే అది మధుమేహం లేదా మధుమేహానికి ముందు దశకు సంకేతం కావచ్చు.",
      hi: "खाली पेट शुगर अधिक होना डायबिटीज़ या प्री-डायबिटीज़ का संकेत हो सकता है।",
    },
  },
  {
    key: "hba1c",
    aliases: ["hba1c", "glycated haemoglobin", "glycated hemoglobin", "a1c"],
    name: { en: "HbA1c (3-month sugar average)", te: "HbA1c (3 నెలల చక్కెర సగటు)", hi: "HbA1c (3 महीने की औसत शुगर)" },
    high: {
      en: "This means your blood sugar has been high on average over the last 3 months.",
      te: "గత 3 నెలలుగా మీ రక్తంలో చక్కెర సగటున ఎక్కువగా ఉందని దీని అర్థం.",
      hi: "इसका मतलब है कि पिछले 3 महीनों में आपकी औसत शुगर अधिक रही है।",
    },
  },
  {
    key: "tsh",
    aliases: ["tsh", "thyroid stimulating hormone"],
    name: { en: "TSH (thyroid)", te: "TSH (థైరాయిడ్)", hi: "TSH (थायरॉइड)" },
    low: {
      en: "Low TSH can mean the thyroid gland is working too much.",
      te: "TSH తక్కువగా ఉంటే థైరాయిడ్ గ్రంథి ఎక్కువగా పని చేస్తోందని అర్థం కావచ్చు.",
      hi: "TSH कम होने का मतलब हो सकता है कि थायरॉइड ग्रंथि ज़्यादा काम कर रही है।",
    },
    high: {
      en: "High TSH can mean the thyroid gland is working too little.",
      te: "TSH ఎక్కువగా ఉంటే థైరాయిడ్ గ్రంథి తక్కువగా పని చేస్తోందని అర్థం కావచ్చు.",
      hi: "TSH अधिक होने का मतलब हो सकता है कि थायरॉइड ग्रंथि कम काम कर रही है।",
    },
  },
  {
    key: "creatinine",
    aliases: ["creatinine", "serum creatinine"],
    name: { en: "creatinine (kidney)", te: "క్రియాటినిన్ (మూత్రపిండాలు)", hi: "क्रिएटिनिन (गुर्दे)" },
    high: {
      en: "High creatinine can mean the kidneys are not filtering as well as they should.",
      te: "క్రియాటినిన్ ఎక్కువగా ఉంటే మూత్రపిండాలు సరిగా పని చేయడం లేదని అర్థం కావచ్చు.",
      hi: "क्रिएटिनिन अधिक होने का मतलब हो सकता है कि गुर्दे ठीक से काम नहीं कर रहे।",
    },
  },
  {
    key: "vitamin_d",
    aliases: ["vitamin d", "vitamin d total", "25 oh vitamin d", "25-oh vitamin d"],
    name: { en: "vitamin D", te: "విటమిన్ D", hi: "विटामिन D" },
    low: {
      en: "Low vitamin D can weaken bones and cause body aches. Sunlight and supplements help.",
      te: "విటమిన్ D తక్కువగా ఉంటే ఎముకలు బలహీనపడి ఒళ్ళు నొప్పులు రావచ్చు. ఎండ, సప్లిమెంట్లు సహాయపడతాయి.",
      hi: "विटामिन D कम होने से हड्डियाँ कमज़ोर हो सकती हैं और बदन दर्द हो सकता है। धूप और सप्लीमेंट से मदद मिलती है।",
    },
  },
  {
    key: "wbc",
    aliases: ["wbc", "total wbc count", "white blood cells", "tlc", "total leucocyte count"],
    name: { en: "white blood cells", te: "తెల్ల రక్త కణాలు", hi: "श्वेत रक्त कोशिकाएँ (WBC)" },
    low: {
      en: "A low count can make it harder to fight infections.",
      te: "ఇవి తక్కువగా ఉంటే ఇన్ఫెక్షన్లతో పోరాడటం కష్టం కావచ్చు.",
      hi: "इनके कम होने से संक्रमण से लड़ना मुश्किल हो सकता है।",
    },
    high: {
      en: "A high count is often a sign that the body is fighting an infection.",
      te: "ఇవి ఎక్కువగా ఉంటే శరీరం ఏదైనా ఇన్ఫెక్షన్‌తో పోరాడుతోందని సంకేతం కావచ్చు.",
      hi: "इनका अधिक होना अक्सर संकेत है कि शरीर किसी संक्रमण से लड़ रहा है।",
    },
  },
];

const normalize = (s: string) =>
  s.toLowerCase().replace(/[()]/g, " ").replace(/[^a-z0-9\- ]/g, " ").replace(/\s+/g, " ").trim();

export function findTest(parameter: string): TestEntry | null {
  const p = normalize(parameter);
  return CATALOG.find((e) => e.aliases.some((a) => p === a || p.startsWith(a + " "))) ?? null;
}

/** Sentence that states the direction. Uses rule-based flags only. */
export function directionSentence(name: L, flag: "LOW" | "HIGH"): L {
  const high = flag === "HIGH";
  return {
    en: `Your ${name.en} is ${high ? "higher" : "lower"} than normal.`,
    te: `మీ పరీక్షలో ${name.te} సాధారణం కంటే ${high ? "ఎక్కువగా" : "తక్కువగా"} ఉంది.`,
    hi: `आपकी जाँच में ${name.hi} सामान्य से ${high ? "अधिक" : "कम"} है।`,
  };
}

export const GENERIC_MEANING: L = {
  en: "Please ask your doctor what this means for you.",
  te: "దీని అర్థం ఏమిటో మీ డాక్టర్‌ను అడగండి.",
  hi: "इसका आपके लिए क्या मतलब है, अपने डॉक्टर से पूछें।",
};
