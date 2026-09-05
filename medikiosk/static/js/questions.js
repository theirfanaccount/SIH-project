/*
 * MediKiosk -- question data
 *
 * This file holds CONTENT only, no logic. Every flow is a set of
 * connected "nodes"; each node is one question. An option's `next`
 * field says which node to go to after picking it -- that's the
 * whole branching mechanism. app.js (the engine) doesn't know or
 * care what the questions ARE, it just walks this structure. That
 * separation is what makes adding a new specialty later (Day 2's
 * fuller AYUSH set, or a second general complaint) a data change,
 * not a code change.
 *
 * Every piece of shown text is { en: "...", hi: "..." } so the whole
 * app can switch language instantly with no server round-trip.
 *
 * `redFlag: true` marks an answer that should trigger the emergency
 * banner on the summary screen (the PS's "red-flag detection"
 * requirement) -- done here as clear, explainable rules rather than
 * a black-box model, which is both safer and something you can fully
 * explain to a judge who asks "how does this actually work?"
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
      en: "AYUSH Consultation — Prakriti Assessment",
      hi: "आयुष परामर्श — प्रकृति परीक्षण",
    },
    start: "body_frame",
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
      result: { type: "prakriti_result" },
      end: { type: "end" },
    },
  },
};
