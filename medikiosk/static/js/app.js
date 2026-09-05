/*
 * MediKiosk -- app engine (Day 1)
 *
 * This file is the "brain" that decides which screen the patient is
 * looking at (mode select -> question flow -> summary) and how to
 * move between them. It has NO medical content of its own -- all of
 * that lives in questions.js. If you wanted to add a third flow
 * tomorrow (say, a second general complaint), you would only touch
 * questions.js, never this file. That split is deliberate: it's
 * what lets you say "our engine is reusable" on the architecture
 * slide instead of "we hardcoded one conversation."
 */

const state = {
  lang: "en", // "en" or "hi" -- everything shown reads from this
  flowId: null, // which FLOWS[...] is currently active
  nodeId: null, // which question node within that flow we're on
  answers: [], // [{ question, answer }] -- what we show the physician
  redFlags: [], // labels of any answer marked redFlag: true
};

const screenEl = document.getElementById("screen");
const langBtn = document.getElementById("langToggle");

// ---------- Language ----------
langBtn.addEventListener("click", () => {
  state.lang = state.lang === "en" ? "hi" : "en";
  langBtn.textContent = state.lang === "en" ? "हिन्दी" : "English";
  render(); // redraw whatever screen is currently showing, in the new language
});

// Small helper: given a {en, hi} object, return the text for the
// current language. Falls back to English if a translation is missing.
function t(field) {
  if (!field) return "";
  return field[state.lang] || field.en;
}

// ---------- Screen: mode select ----------
function showModeSelect() {
  state.flowId = null;
  state.nodeId = null;
  state.answers = [];
  state.redFlags = [];

  screenEl.innerHTML = `
    <div class="mode-select">
      <h1>${state.lang === "en" ? "Welcome. How can we help today?" : "स्वागत है। आज हम आपकी कैसे मदद कर सकते हैं?"}</h1>
      <p class="subtitle">${
        state.lang === "en"
          ? "Tap a card to begin. You can speak your answers or tap them."
          : "शुरू करने के लिए कार्ड पर टैप करें। आप बोलकर या टैप करके जवाब दे सकते हैं।"
      }</p>
      <div class="mode-cards">
        <button class="mode-card" data-flow="general_chest_pain" type="button">
          <span class="mode-icon">🫀</span>
          <span class="mode-title">${state.lang === "en" ? "General Consultation" : "सामान्य परामर्श"}</span>
          <span class="mode-desc">${state.lang === "en" ? "For everyday symptoms (demo: chest pain)" : "सामान्य लक्षणों के लिए (डेमो: सीने में दर्द)"}</span>
        </button>
        <button class="mode-card mode-card--ayush" data-flow="ayush_prakriti" type="button">
          <span class="mode-icon">🌿</span>
          <span class="mode-title">${state.lang === "en" ? "AYUSH Consultation" : "आयुष परामर्श"}</span>
          <span class="mode-desc">${state.lang === "en" ? "Ayurvedic Prakriti assessment" : "आयुर्वेदिक प्रकृति परीक्षण"}</span>
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll(".mode-card").forEach((btn) => {
    btn.addEventListener("click", () => startFlow(btn.dataset.flow));
  });
}

function startFlow(flowId) {
  state.flowId = flowId;
  state.nodeId = FLOWS[flowId].start;
  state.answers = [];
  state.redFlags = [];
  render();
}

// ---------- Router: decide which screen to draw ----------
function render() {
  if (!state.flowId) return showModeSelect();

  const flow = FLOWS[state.flowId];
  const node = flow.nodes[state.nodeId];

  if (node.type === "end") return showSummary(flow);
  if (node.type === "prakriti_result") return showPrakritiResult(flow);

  renderQuestion(flow, node);
}

// ---------- Screen: a question ----------
function renderQuestion(flow, node) {
  const nodeIds = Object.keys(flow.nodes);
  const progressPct = Math.round((nodeIds.indexOf(state.nodeId) / nodeIds.length) * 100);

  let optionsHtml = "";
  if (node.type === "single" || node.type === "multi") {
    optionsHtml = node.options
      .map((opt, i) => `<button class="option-btn" data-index="${i}" type="button">${t(opt.label)}</button>`)
      .join("");
  } else if (node.type === "scale") {
    optionsHtml = `<div class="scale-row">${Array.from({ length: node.max - node.min + 1 }, (_, i) => node.min + i)
      .map((n) => `<button class="scale-btn" data-value="${n}" type="button">${n}</button>`)
      .join("")}</div>`;
  }

  screenEl.innerHTML = `
    <div class="question-screen">
      <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
      <h2 class="question-text">${t(node.text)}</h2>
      <div class="options ${node.type === "scale" ? "options--scale" : ""}">${optionsHtml}</div>
      ${node.type === "multi" ? `<button id="multiNext" class="next-btn" type="button">${state.lang === "en" ? "Continue" : "आगे बढ़ें"}</button>` : ""}
      <button id="backBtn" class="back-btn" type="button">${state.lang === "en" ? "← Start over" : "← फिर से शुरू करें"}</button>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", showModeSelect);

  if (node.type === "single") {
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const opt = node.options[Number(btn.dataset.index)];
        state.answers.push({ question: t(node.text), answer: t(opt.label), value: opt.value });
        if (opt.redFlag) state.redFlags.push(t(opt.label));
        state.nodeId = opt.next;
        render();
      });
    });
  } else if (node.type === "multi") {
    const selected = new Set();
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.index);
        btn.classList.toggle("selected");
        if (selected.has(i)) selected.delete(i);
        else selected.add(i);
      });
    });
    document.getElementById("multiNext").addEventListener("click", () => {
      const chosenLabels = [];
      selected.forEach((i) => {
        const opt = node.options[i];
        chosenLabels.push(t(opt.label));
        if (opt.redFlag) state.redFlags.push(t(opt.label));
      });
      if (chosenLabels.length === 0) chosenLabels.push(state.lang === "en" ? "None" : "कोई नहीं");
      state.answers.push({ question: t(node.text), answer: chosenLabels.join(", ") });
      state.nodeId = node.next;
      render();
    });
  } else if (node.type === "scale") {
    document.querySelectorAll(".scale-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.answers.push({ question: t(node.text), answer: btn.dataset.value });
        state.nodeId = node.next;
        render();
      });
    });
  }
}

// ---------- Screen: Prakriti result (AYUSH-specific) ----------
function showPrakritiResult(flow) {
  // Tally how many answers pointed to each dosha. This is a simple,
  // fully transparent count -- not a model, so you can explain
  // exactly how the result was reached if a judge asks.
  const counts = { vata: 0, pitta: 0, kapha: 0 };
  // Each single-choice answer stored its option's raw value (see
  // renderQuestion above), so the tally is just a direct count --
  // no re-matching or guessing which option was picked.
  state.answers.forEach((a) => {
    if (a.value && counts[a.value] !== undefined) counts[a.value]++;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][1] > 0 ? sorted[0][0] : "vata";
  const doshaNames = {
    vata: { en: "Vata", hi: "वात" },
    pitta: { en: "Pitta", hi: "पित्त" },
    kapha: { en: "Kapha", hi: "कफ" },
  };

  const otherParams = [
    { en: "Vikriti (current imbalance)", hi: "विकृति (वर्तमान असंतुलन)" },
    { en: "Sara (tissue quality)", hi: "सार (धातु गुणवत्ता)" },
    { en: "Samhanana (body compactness)", hi: "संहनन (शरीर सुदृढ़ता)" },
    { en: "Pramana (body measurements)", hi: "प्रमाण (शारीरिक माप)" },
    { en: "Satmya (compatibility)", hi: "सात्म्य (अनुकूलता)" },
    { en: "Vyayama Shakti (exercise capacity)", hi: "व्यायाम शक्ति" },
    { en: "Vaya (age)", hi: "वय (आयु)" },
  ];

  screenEl.innerHTML = `
    <div class="summary-screen">
      <h2>${state.lang === "en" ? "Preliminary Prakriti Assessment" : "प्रारंभिक प्रकृति परीक्षण"}</h2>
      <div class="prakriti-result">${t(doshaNames[dominant])}${
    state.lang === "en" ? "-predominant (based on your answers)" : "-प्रधान (आपके उत्तरों के आधार पर)"
  }</div>
      <p class="note">${
        state.lang === "en"
          ? "This is a preliminary, patient-reported estimate. Your Vaidya will confirm this with direct examination (pulse, tongue, build)."
          : "यह एक प्रारंभिक, रोगी-रिपोर्टेड अनुमान है। आपके वैद्य इसे प्रत्यक्ष परीक्षण (नाड़ी, जीभ, शरीर) से पुष्ट करेंगे।"
      }</p>
      <h3>${state.lang === "en" ? "Assessed by your physician during the full Dashavidha Pariksha:" : "पूर्ण दशविध परीक्षा के दौरान चिकित्सक द्वारा मूल्यांकित:"}</h3>
      <ul class="param-list">${otherParams.map((p) => `<li>${t(p)}</li>`).join("")}</ul>
      <button id="toEnd" class="next-btn" type="button">${state.lang === "en" ? "Finish" : "समाप्त करें"}</button>
    </div>
  `;

  document.getElementById("toEnd").addEventListener("click", () => showSummary(flow));
}

// ---------- Screen: final summary ----------
function showSummary(flow) {
  const hasRedFlag = state.redFlags.length > 0;

  screenEl.innerHTML = `
    <div class="summary-screen">
      ${
        hasRedFlag
          ? `<div class="redflag-banner">⚠ ${
              state.lang === "en"
                ? "Possible emergency signs detected — alerting staff for priority triage."
                : "आपातकालीन लक्षण संभव — कर्मचारियों को प्राथमिकता ट्राइएज के लिए सूचित किया जा रहा है।"
            }</div>`
          : ""
      }
      <h2>${state.lang === "en" ? "History Summary — for physician review" : "इतिहास सारांश — चिकित्सक समीक्षा हेतु"}</h2>
      <p class="subtitle">${flow.title ? t(flow.title) : ""}</p>
      <dl class="summary-list">
        ${state.answers.map((a) => `<dt>${a.question}</dt><dd>${a.answer}</dd>`).join("")}
      </dl>
      <button id="restart" class="next-btn" type="button">${state.lang === "en" ? "Done — Back to Start" : "पूर्ण — शुरुआत पर वापस जाएं"}</button>
    </div>
  `;

  document.getElementById("restart").addEventListener("click", showModeSelect);
}

// Boot the app on the mode-select screen.
showModeSelect();
