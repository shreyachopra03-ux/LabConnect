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
  {
    key: "hdl",
    aliases: ["hdl", "hdl cholesterol", "hdl c", "hdl-c"],
    name: { en: "HDL (good) cholesterol", te: "HDL (మంచి) కొలెస్ట్రాల్", hi: "HDL (अच्छा) कोलेस्ट्रॉल" },
    low: {
      en: "Low HDL means less protection for the heart. Exercise and healthy food can raise it.",
      te: "HDL తక్కువగా ఉంటే గుండెకు రక్షణ తగ్గుతుంది. వ్యాయామం, ఆరోగ్యకరమైన ఆహారం దీన్ని పెంచుతాయి.",
      hi: "HDL कम होने का मतलब है दिल की सुरक्षा कम। व्यायाम और सेहतमंद खाना इसे बढ़ा सकते हैं।",
    },
  },
  {
    key: "triglycerides",
    aliases: ["triglycerides", "triglyceride", "tg", "serum triglycerides"],
    name: { en: "triglycerides (blood fat)", te: "ట్రైగ్లిజరైడ్స్ (రక్తంలో కొవ్వు)", hi: "ट्राइग्लिसराइड (खून में चर्बी)" },
    high: {
      en: "High blood fat raises the risk of heart disease. Less sugar, oil and alcohol helps.",
      te: "రక్తంలో కొవ్వు ఎక్కువగా ఉంటే గుండె జబ్బుల ప్రమాదం పెరుగుతుంది. చక్కెర, నూనె, మద్యం తగ్గించడం సహాయపడుతుంది.",
      hi: "खून में चर्बी अधिक होने से दिल की बीमारी का खतरा बढ़ता है। चीनी, तेल और शराब कम करने से मदद मिलती है।",
    },
  },
  {
    key: "glucose_pp",
    aliases: ["glucose pp", "glucose post prandial", "post prandial blood sugar", "ppbs", "blood sugar pp"],
    name: { en: "after-meal blood sugar", te: "భోజనం తర్వాత రక్తంలో చక్కెర", hi: "खाने के बाद ब्लड शुगर" },
    high: {
      en: "High sugar after meals can be a sign of diabetes or pre-diabetes.",
      te: "భోజనం తర్వాత చక్కెర ఎక్కువగా ఉంటే అది మధుమేహం లేదా మధుమేహానికి ముందు దశకు సంకేతం కావచ్చు.",
      hi: "खाने के बाद शुगर अधिक होना डायबिटीज़ या प्री-डायबिटीज़ का संकेत हो सकता है।",
    },
  },
  {
    key: "glucose_random",
    aliases: ["glucose random", "random blood sugar", "rbs", "random glucose"],
    name: { en: "random blood sugar", te: "రాండమ్ రక్తంలో చక్కెర", hi: "रैंडम ब्लड शुगर" },
    low: {
      en: "Low sugar can cause shaking, sweating or dizziness.",
      te: "చక్కెర తక్కువగా ఉంటే వణుకు, చెమట లేదా తల తిరగడం రావచ్చు.",
      hi: "शुगर कम होने से कंपकंपी, पसीना या चक्कर आ सकते हैं।",
    },
    high: {
      en: "High sugar can be a sign of diabetes.",
      te: "చక్కెర ఎక్కువగా ఉంటే అది మధుమేహానికి సంకేతం కావచ్చు.",
      hi: "शुगर अधिक होना डायबिटीज़ का संकेत हो सकता है।",
    },
  },
  {
    key: "urea",
    aliases: ["urea", "blood urea", "serum urea", "bun", "blood urea nitrogen"],
    name: { en: "urea (kidney)", te: "యూరియా (మూత్రపిండాలు)", hi: "यूरिया (गुर्दे)" },
    high: {
      en: "High urea can mean the kidneys need attention, or that you are not drinking enough water.",
      te: "యూరియా ఎక్కువగా ఉంటే మూత్రపిండాలను పరీక్షించాల్సి ఉండవచ్చు, లేదా మీరు తగినంత నీరు తాగడం లేదని అర్థం కావచ్చు.",
      hi: "यूरिया अधिक होने का मतलब हो सकता है कि गुर्दों पर ध्यान देना ज़रूरी है, या आप पर्याप्त पानी नहीं पी रहे।",
    },
  },
  {
    key: "uric_acid",
    aliases: ["uric acid", "serum uric acid"],
    name: { en: "uric acid", te: "యూరిక్ యాసిడ్", hi: "यूरिक एसिड" },
    high: {
      en: "High uric acid can cause joint pain (gout) and kidney stones.",
      te: "యూరిక్ యాసిడ్ ఎక్కువగా ఉంటే కీళ్ల నొప్పులు (గౌట్), మూత్రపిండాల్లో రాళ్లు రావచ్చు.",
      hi: "यूरिक एसिड अधिक होने से जोड़ों में दर्द (गठिया) और गुर्दे की पथरी हो सकती है।",
    },
  },
  {
    key: "sodium",
    aliases: ["sodium", "na", "serum sodium"],
    name: { en: "sodium (salt)", te: "సోడియం (ఉప్పు)", hi: "सोडियम (नमक)" },
    low: {
      en: "Low sodium can cause tiredness, headache or confusion.",
      te: "సోడియం తక్కువగా ఉంటే అలసట, తలనొప్పి లేదా అయోమయం రావచ్చు.",
      hi: "सोडियम कम होने से थकान, सिरदर्द या उलझन हो सकती है।",
    },
    high: {
      en: "High sodium is often linked to not drinking enough water.",
      te: "సోడియం ఎక్కువగా ఉండటం తరచుగా తగినంత నీరు తాగకపోవడం వల్ల జరుగుతుంది.",
      hi: "सोडियम अधिक होना अक्सर पर्याप्त पानी न पीने से जुड़ा होता है।",
    },
  },
  {
    key: "calcium",
    aliases: ["calcium", "serum calcium", "total calcium"],
    name: { en: "calcium", te: "కాల్షియం", hi: "कैल्शियम" },
    low: {
      en: "Low calcium can cause muscle cramps or weak bones.",
      te: "కాల్షియం తక్కువగా ఉంటే కండరాల తిమ్మిరి లేదా ఎముకల బలహీనత రావచ్చు.",
      hi: "कैल्शियम कम होने से मांसपेशियों में ऐंठन या हड्डियाँ कमज़ोर हो सकती हैं।",
    },
    high: {
      en: "High calcium can cause tiredness, thirst or kidney stones.",
      te: "కాల్షియం ఎక్కువగా ఉంటే అలసట, దాహం లేదా మూత్రపిండాల్లో రాళ్లు రావచ్చు.",
      hi: "कैल्शियम अधिक होने से थकान, प्यास या गुर्दे की पथरी हो सकती है।",
    },
  },
  {
    key: "alt",
    aliases: ["sgpt", "alt", "sgpt alt", "alt sgpt", "alanine aminotransferase"],
    name: { en: "SGPT (liver)", te: "SGPT (కాలేయం)", hi: "SGPT (लिवर)" },
    high: {
      en: "A high value can mean the liver is under stress, for example from fatty liver, alcohol or some medicines.",
      te: "ఇది ఎక్కువగా ఉంటే కాలేయంపై ఒత్తిడి ఉందని అర్థం కావచ్చు, ఉదాహరణకు కొవ్వు కాలేయం, మద్యం లేదా కొన్ని మందుల వల్ల.",
      hi: "इसका अधिक होना बता सकता है कि लिवर पर दबाव है, जैसे फैटी लिवर, शराब या कुछ दवाओं से।",
    },
  },
  {
    key: "ast",
    aliases: ["sgot", "ast", "sgot ast", "ast sgot", "aspartate aminotransferase"],
    name: { en: "SGOT (liver)", te: "SGOT (కాలేయం)", hi: "SGOT (लिवर)" },
    high: {
      en: "A high value can mean the liver is under stress, for example from fatty liver, alcohol or some medicines.",
      te: "ఇది ఎక్కువగా ఉంటే కాలేయంపై ఒత్తిడి ఉందని అర్థం కావచ్చు, ఉదాహరణకు కొవ్వు కాలేయం, మద్యం లేదా కొన్ని మందుల వల్ల.",
      hi: "इसका अधिक होना बता सकता है कि लिवर पर दबाव है, जैसे फैटी लिवर, शराब या कुछ दवाओं से।",
    },
  },
  {
    key: "bilirubin",
    aliases: ["bilirubin", "total bilirubin", "bilirubin total", "serum bilirubin"],
    name: { en: "bilirubin", te: "బిలిరుబిన్", hi: "बिलीरुबिन" },
    high: {
      en: "High bilirubin can cause yellow eyes or skin (jaundice) and may point to a liver problem.",
      te: "బిలిరుబిన్ ఎక్కువగా ఉంటే కళ్ళు లేదా చర్మం పసుపు రంగులోకి మారవచ్చు (కామెర్లు). ఇది కాలేయ సమస్యను సూచించవచ్చు.",
      hi: "बिलीरुबिन अधिक होने से आँखें या त्वचा पीली हो सकती हैं (पीलिया)। यह लिवर की समस्या का संकेत हो सकता है।",
    },
  },
  {
    key: "alp",
    aliases: ["alkaline phosphatase", "alp"],
    name: { en: "alkaline phosphatase (liver and bone)", te: "ఆల్కలైన్ ఫాస్ఫటేజ్ (కాలేయం, ఎముకలు)", hi: "एल्कलाइन फॉस्फेटेज़ (लिवर और हड्डी)" },
    high: {
      en: "A high value can come from the liver or the bones.",
      te: "ఇది ఎక్కువగా ఉండటానికి కాలేయం లేదా ఎముకలు కారణం కావచ్చు.",
      hi: "इसका अधिक होना लिवर या हड्डियों से जुड़ा हो सकता है।",
    },
  },
  {
    key: "albumin",
    aliases: ["albumin", "serum albumin"],
    name: { en: "albumin (protein)", te: "ఆల్బుమిన్ (ప్రోటీన్)", hi: "एल्ब्यूमिन (प्रोटीन)" },
    low: {
      en: "Low albumin can be due to poor nutrition, or a liver or kidney problem.",
      te: "ఆల్బుమిన్ తక్కువగా ఉండటానికి పోషకాహార లోపం, లేదా కాలేయ లేదా మూత్రపిండాల సమస్య కారణం కావచ్చు.",
      hi: "एल्ब्यूमिन कम होने का कारण कम पोषण, या लिवर या गुर्दे की समस्या हो सकती है।",
    },
  },
  {
    key: "egfr",
    aliases: ["egfr", "estimated gfr"],
    name: { en: "eGFR (kidney filtering)", te: "eGFR (మూత్రపిండాల వడపోత)", hi: "eGFR (गुर्दे की छनाई)" },
    low: {
      en: "A low eGFR means the kidneys are filtering less than normal.",
      te: "eGFR తక్కువగా ఉంటే మూత్రపిండాలు సాధారణం కంటే తక్కువగా వడపోస్తున్నాయని అర్థం.",
      hi: "eGFR कम होने का मतलब है कि गुर्दे सामान्य से कम छनाई कर रहे हैं।",
    },
  },
  {
    key: "vitamin_b12",
    aliases: ["vitamin b12", "b12", "vit b12", "cyanocobalamin"],
    name: { en: "vitamin B12", te: "విటమిన్ B12", hi: "विटामिन B12" },
    low: {
      en: "Low vitamin B12 can cause tiredness, tingling in the hands and feet, or memory problems.",
      te: "విటమిన్ B12 తక్కువగా ఉంటే అలసట, చేతులు కాళ్ళలో తిమ్మిర్లు లేదా మతిమరుపు రావచ్చు.",
      hi: "विटामिन B12 कम होने से थकान, हाथ-पैरों में झुनझुनी या याददाश्त की समस्या हो सकती है।",
    },
  },
  {
    key: "ferritin",
    aliases: ["ferritin", "serum ferritin"],
    name: { en: "ferritin (iron store)", te: "ఫెరిటిన్ (ఐరన్ నిల్వ)", hi: "फेरिटिन (आयरन का भंडार)" },
    low: {
      en: "Low ferritin means the body's iron stores are low.",
      te: "ఫెరిటిన్ తక్కువగా ఉంటే శరీరంలో ఐరన్ నిల్వలు తక్కువగా ఉన్నాయని అర్థం.",
      hi: "फेरिटिन कम होने का मतलब है कि शरीर में आयरन का भंडार कम है।",
    },
    high: {
      en: "High ferritin can be due to inflammation or too much iron in the body.",
      te: "ఫెరిటిన్ ఎక్కువగా ఉండటానికి వాపు లేదా శరీరంలో ఐరన్ ఎక్కువగా ఉండటం కారణం కావచ్చు.",
      hi: "फेरिटिन अधिक होने का कारण सूजन या शरीर में ज़्यादा आयरन हो सकता है।",
    },
  },
  {
    key: "free_t4",
    aliases: ["free t4", "ft4", "t4 free"],
    name: { en: "free T4 (thyroid)", te: "ఫ్రీ T4 (థైరాయిడ్)", hi: "फ्री T4 (थायरॉइड)" },
    low: {
      en: "Low T4 can mean the thyroid gland is working too little.",
      te: "T4 తక్కువగా ఉంటే థైరాయిడ్ గ్రంథి తక్కువగా పని చేస్తోందని అర్థం కావచ్చు.",
      hi: "T4 कम होने का मतलब हो सकता है कि थायरॉइड ग्रंथि कम काम कर रही है।",
    },
    high: {
      en: "High T4 can mean the thyroid gland is working too much.",
      te: "T4 ఎక్కువగా ఉంటే థైరాయిడ్ గ్రంథి ఎక్కువగా పని చేస్తోందని అర్థం కావచ్చు.",
      hi: "T4 अधिक होने का मतलब हो सकता है कि थायरॉइड ग्रंथि ज़्यादा काम कर रही है।",
    },
  },
  {
    key: "esr",
    aliases: ["esr", "erythrocyte sedimentation rate"],
    name: { en: "ESR (inflammation)", te: "ESR (వాపు)", hi: "ESR (सूजन)" },
    high: {
      en: "A high ESR shows there may be inflammation or infection somewhere in the body.",
      te: "ESR ఎక్కువగా ఉంటే శరీరంలో ఎక్కడైనా వాపు లేదా ఇన్ఫెక్షన్ ఉండవచ్చని సూచిస్తుంది.",
      hi: "ESR अधिक होना बताता है कि शरीर में कहीं सूजन या संक्रमण हो सकता है।",
    },
  },
  {
    key: "crp",
    aliases: ["crp", "c reactive protein", "c-reactive protein", "hs crp", "hs-crp"],
    name: { en: "CRP (inflammation)", te: "CRP (వాపు)", hi: "CRP (सूजन)" },
    high: {
      en: "A high CRP is often a sign of infection or inflammation.",
      te: "CRP ఎక్కువగా ఉండటం తరచుగా ఇన్ఫెక్షన్ లేదా వాపుకు సంకేతం.",
      hi: "CRP अधिक होना अक्सर संक्रमण या सूजन का संकेत है।",
    },
  },
  {
    key: "platelets",
    aliases: ["platelets", "platelet count", "plt"],
    name: { en: "platelets", te: "ప్లేట్‌లెట్లు", hi: "प्लेटलेट्स" },
    low: {
      en: "Low platelets can make you bruise or bleed more easily.",
      te: "ప్లేట్‌లెట్లు తక్కువగా ఉంటే సులభంగా గాయాలు లేదా రక్తస్రావం కావచ్చు.",
      hi: "प्लेटलेट्स कम होने से आसानी से नील पड़ सकते हैं या खून बह सकता है।",
    },
    high: {
      en: "High platelets are often due to infection, inflammation or low iron.",
      te: "ప్లేట్‌లెట్లు ఎక్కువగా ఉండటానికి ఇన్ఫెక్షన్, వాపు లేదా ఐరన్ లోపం కారణం కావచ్చు.",
      hi: "प्लेटलेट्स अधिक होने का कारण अक्सर संक्रमण, सूजन या आयरन की कमी होता है।",
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
