/*
 * MediKiosk -- question data
 *
 * This file holds CONTENT only, no logic. Every flow is a set of
 * connected "nodes"; each node is one question. An option's `next`
 * field says which node to go to after picking it -- that's the
 * whole branching mechanism. app.js (the engine) doesn't know or
 * care what the questions ARE, it just walks this structure. That
 * separation is what makes adding today's fuller AYUSH section a
 * data change, not a rewrite of app.js.
 *
 * Every piece of shown text is { en: "...", hi: "..." } so the whole
 * app can switch language instantly with no server round-trip.
 *
 * `redFlag: true` marks an answer that should trigger the emergency
 * banner on the summary screen -- done as clear, explainable rules
 * rather than a black-box model, which is safer and something you
 * can fully explain if a judge asks "how does this actually work?"
 *
 * A flow can declare `physicianOnlyParams`: a list of things the
 * summary screen should show as "assessed by the physician directly"
 * rather than pretending the kiosk measured them. Day 1 hardcoded
 * this only for Prakriti's own result screen; today it lives on the
 * flow itself, so the summary screen can show it generically for any
 * flow that declares it.
 */

const FLOWS = {
  general_chest_pain: {
    id: "general_chest_pain",
    title: {
      en: "General Consultation — Chest Pain",
      hi: "सामान्य परामर्श — सीने में दर्द",
    },
    start: "site",
    nodes: {
      site: {
        text: { en: "Where exactly is the pain?", hi: "दर्द ठीक कहाँ हो रहा है?" },
        type: "single",
        options: [
          { label: { en: "Center of chest", hi: "छाती के बीच में" }, value: "central", next: "onset" },
          { label: { en: "Left side", hi: "बाईं ओर" }, value: "left", next: "onset" },
          { label: { en: "Right side", hi: "दाईं ओर" }, value: "right", next: "onset" },
          { label: { en: "All over the chest", hi: "पूरी छाती में" }, value: "diffuse", next: "onset" },
        ],
      },
      onset: {
        text: { en: "When did it start, and how suddenly?", hi: "यह कब शुरू हुआ, और कितनी अचानक?" },
        type: "single",
        options: [
          { label: { en: "Suddenly, within seconds", hi: "अचानक, कुछ ही सेकंड में" }, value: "sudden", next: "character", redFlag: true },
          { label: { en: "Gradually, over hours", hi: "धीरे-धीरे, घंटों में" }, value: "gradual", next: "character" },
          { label: { en: "On and off for days", hi: "कई दिनों से रुक-रुक कर" }, value: "intermittent", next: "character" },
        ],
      },
      character: {
        text: { en: "What does the pain feel like?", hi: "दर्द कैसा महसूस होता है?" },
        type: "single",
        options: [
          { label: { en: "Crushing / heavy pressure", hi: "भारीपन / दबाव जैसा" }, value: "crushing", next: "radiation", redFlag: true },
          { label: { en: "Sharp / stabbing", hi: "तेज़ / चुभने जैसा" }, value: "sharp", next: "radiation" },
          { label: { en: "Burning", hi: "जलन जैसा" }, value: "burning", next: "radiation" },
        ],
      },
      radiation: {
        text: { en: "Does the pain spread to your arm, jaw, or back?", hi: "क्या दर्द बांह, जबड़े या पीठ तक फैलता है?" },
        type: "single",
        options: [
          { label: { en: "Yes, to the left arm or jaw", hi: "हाँ, बाईं बांह या जबड़े तक" }, value: "arm_jaw", next: "associated", redFlag: true },
          { label: { en: "Yes, to the back", hi: "हाँ, पीठ तक" }, value: "back", next: "associated" },
          { label: { en: "No", hi: "नहीं" }, value: "none", next: "associated" },
        ],
      },
      associated: {
        text: { en: "Do you also have any of these right now?", hi: "क्या अभी आपको इनमें से कुछ भी हो रहा है?" },
        type: "multi",
        options: [
          { label: { en: "Shortness of breath", hi: "सांस लेने में तकलीफ" }, value: "dyspnoea", redFlag: true },
          { label: { en: "Sweating", hi: "पसीना आना" }, value: "sweating", redFlag: true },
          { label: { en: "Nausea or vomiting", hi: "जी मिचलाना या उल्टी" }, value: "nausea" },
          { label: { en: "None of these", hi: "इनमें से कुछ नहीं" }, value: "none" },
        ],
        next: "severity",
      },
      severity: {
        text: { en: "On a scale of 1 to 10, how severe is it right now?", hi: "1 से 10 के पैमाने पर, अभी यह कितना गंभीर है?" },
        type: "scale",
        min: 1,
        max: 10,
        next: "end",
      },
      end: { type: "end" },
    },
  },

  ayush_prakriti: {
    id: "ayush_prakriti",
    title: {
      en: "AYUSH Consultation — Dashavidha Pariksha",
      hi: "आयुष परामर्श — दशविध परीक्षा",
    },
    start: "body_frame",
    physicianOnlyParams: [
      { en: "Sara (tissue quality)", hi: "सार (धातु गुणवत्ता)" },
      { en: "Samhanana (body compactness)", hi: "संहनन (शरीर सुदृढ़ता)" },
      { en: "Pramana (body measurements)", hi: "प्रमाण (शारीरिक माप)" },
    ],
    nodes: {
      body_frame: {
        text: { en: "Which best describes your natural body frame?", hi: "आपकी स्वाभाविक शरीर संरचना किससे मिलती है?" },
        type: "single",
        options: [
          { label: { en: "Thin, light, find it hard to gain weight", hi: "पतला, हल्का, वजन बढ़ाना मुश्किल" }, value: "vata", next: "skin" },
          { label: { en: "Medium build, athletic, moderate weight", hi: "मध्यम कद, सक्रिय, संतुलित वजन" }, value: "pitta", next: "skin" },
          { label: { en: "Solid, heavier frame, gains weight easily", hi: "मजबूत, भारी शरीर, वजन आसानी से बढ़ता है" }, value: "kapha", next: "skin" },
        ],
      },
      skin: {
        text: { en: "How would you describe your skin, usually?", hi: "सामान्यतः आपकी त्वचा कैसी रहती है?" },
        type: "single",
        options: [
          { label: { en: "Dry, thin, cool to touch", hi: "सूखी, पतली, छूने में ठंडी" }, value: "vata", next: "appetite" },
          { label: { en: "Warm, soft, prone to redness or acne", hi: "गर्म, मुलायम, लालिमा या मुहांसे होने की प्रवृत्ति" }, value: "pitta", next: "appetite" },
          { label: { en: "Thick, oily, cool and smooth", hi: "मोटी, तैलीय, ठंडी और चिकनी" }, value: "kapha", next: "appetite" },
        ],
      },
      appetite: {
        text: { en: "How is your digestion and appetite, generally?", hi: "सामान्यतः आपकी पाचन शक्ति और भूख कैसी है?" },
        type: "single",
        options: [
          { label: { en: "Irregular — sometimes strong, sometimes none", hi: "अनियमित — कभी तेज़, कभी बिल्कुल नहीं" }, value: "vata", next: "mind" },
          { label: { en: "Strong and sharp, irritable if I skip a meal", hi: "तेज़ और तीव्र, खाना छूटने पर चिड़चिड़ापन" }, value: "pitta", next: "mind" },
          { label: { en: "Slow and steady, can skip meals easily", hi: "धीमी और स्थिर, आसानी से भोजन छोड़ सकता/सकती हूं" }, value: "kapha", next: "mind" },
        ],
      },
      mind: {
        text: { en: "Under stress, you tend to become...", hi: "तनाव में आप अक्सर..." },
        type: "single",
        options: [
          { label: { en: "Anxious or worried", hi: "चिंतित या बेचैन" }, value: "vata", next: "result" },
          { label: { en: "Irritable or impatient", hi: "चिड़चिड़े या अधीर" }, value: "pitta", next: "result" },
          { label: { en: "Withdrawn or slow to react", hi: "शांत या धीमी प्रतिक्रिया देने वाले" }, value: "kapha", next: "result" },
        ],
      },
      result: { type: "prakriti_result", next: "vikriti" },

      vikriti: {
        text: { en: "Right now, which of these feels most true for you?", hi: "अभी आपको इनमें से कौन-सी स्थिति सबसे सही लगती है?" },
        type: "single",
        options: [
          { label: { en: "Excess gas, dryness, or restlessness", hi: "अत्यधिक गैस, रूखापन, या बेचैनी" }, value: "vata", next: "ahara_shakti" },
          { label: { en: "Burning sensation, excess heat, or irritability", hi: "जलन, अत्यधिक गर्मी, या चिड़चिड़ापन" }, value: "pitta", next: "ahara_shakti" },
          { label: { en: "Heaviness, congestion, or sluggishness", hi: "भारीपन, जकड़न, या सुस्ती" }, value: "kapha", next: "ahara_shakti" },
        ],
      },

      ahara_shakti: {
        text: { en: "How would you rate your current digestive strength?", hi: "आपकी वर्तमान पाचन शक्ति कैसी है?" },
        type: "single",
        options: [
          { label: { en: "Weak — bloated or uncomfortable after small meals", hi: "कमजोर — थोड़ा खाने पर भी भारीपन या असुविधा" }, value: "weak", next: "vyayama_shakti" },
          { label: { en: "Strong — digest most foods well", hi: "मजबूत — अधिकतर भोजन आसानी से पचता है" }, value: "strong", next: "vyayama_shakti" },
          { label: { en: "Variable — depends on what and when I eat", hi: "परिवर्तनशील — क्या और कब खाया, इस पर निर्भर" }, value: "variable", next: "vyayama_shakti" },
        ],
      },

      vyayama_shakti: {
        text: { en: "How much physical exertion can you comfortably manage?", hi: "आप कितनी शारीरिक मेहनत आराम से कर सकते हैं?" },
        type: "single",
        options: [
          { label: { en: "Very little — I tire quickly", hi: "बहुत कम — मैं जल्दी थक जाता/जाती हूं" }, value: "low", next: "satmya" },
          { label: { en: "Moderate — regular daily activity is fine", hi: "मध्यम — रोज़मर्रा की गतिविधि ठीक रहती है" }, value: "moderate", next: "satmya" },
          { label: { en: "High — I can sustain hard physical work", hi: "अधिक — मैं कठिन शारीरिक कार्य कर सकता/सकती हूं" }, value: "high", next: "satmya" },
        ],
      },

      satmya: {
        text: { en: "Are there specific foods, seasons, or climates that consistently disagree with you?", hi: "क्या कुछ खास भोजन, मौसम या जलवायु आपको लगातार परेशान करते हैं?" },
        type: "single",
        options: [
          { label: { en: "Yes, several", hi: "हाँ, कई" }, value: "low_satmya", next: "satva" },
          { label: { en: "A few, occasionally", hi: "कभी-कभी, कुछ" }, value: "medium_satmya", next: "satva" },
          { label: { en: "No, I adapt well to most conditions", hi: "नहीं, मैं अधिकतर परिस्थितियों में ढल जाता/जाती हूं" }, value: "high_satmya", next: "satva" },
        ],
      },

      satva: {
        text: { en: "How would you describe your resilience under mental or emotional stress?", hi: "मानसिक या भावनात्मक तनाव में आपकी सहनशक्ति कैसी है?" },
        type: "single",
        options: [
          { label: { en: "I get overwhelmed easily", hi: "मैं जल्दी अभिभूत हो जाता/जाती हूं" }, value: "low_satva", next: "vaya" },
          { label: { en: "I manage reasonably well most of the time", hi: "अधिकतर समय मैं ठीक-ठाक संभाल लेता/लेती हूं" }, value: "medium_satva", next: "vaya" },
          { label: { en: "I stay steady even under significant pressure", hi: "बड़े दबाव में भी मैं स्थिर रहता/रहती हूं" }, value: "high_satva", next: "vaya" },
        ],
      },

      vaya: {
        text: { en: "Finally, what is your age?", hi: "अंत में, आपकी आयु क्या है?" },
        type: "number",
        next: "end",
      },

      end: { type: "end" },
    },
  },
};
