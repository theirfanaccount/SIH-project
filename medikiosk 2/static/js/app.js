/*
 * MediKiosk -- app engine (Day 2)
 *
 * This file is the "brain" that decides which screen the patient is
 * looking at and how to move between them. It has NO medical content
 * of its own -- that lives in questions.js. New today: a "number"
 * question type, a document-digitization screen (OCR), and a
 * "generate FHIR bundle" action on the summary screen.
 */

const state = {
  lang: "en",
  flowId: null,
  nodeId: null,
  answers: [],
  redFlags: [],
  patientAge: null, // captured separately so the FHIR bundle can use it directly
};

const screenEl = document.getElementById("screen");
const langBtn = document.getElementById("langToggle");

// ---------- Language ----------
langBtn.addEventListener("click", () => {
  state.lang = state.lang === "en" ? "hi" : "en";
  langBtn.textContent = state.lang === "en" ? "हिन्दी" : "English";
  render();
});

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
        <button class="mode-card" data-mode="general_chest_pain" type="button">
          <span class="mode-icon">🫀</span>
          <span class="mode-title">${state.lang === "en" ? "General Consultation" : "सामान्य परामर्श"}</span>
          <span class="mode-desc">${state.lang === "en" ? "For everyday symptoms (demo: chest pain)" : "सामान्य लक्षणों के लिए (डेमो: सीने में दर्द)"}</span>
        </button>
        <button class="mode-card mode-card--ayush" data-mode="ayush_prakriti" type="button">
          <span class="mode-icon">🌿</span>
          <span class="mode-title">${state.lang === "en" ? "AYUSH Consultation" : "आयुष परामर्श"}</span>
          <span class="mode-desc">${state.lang === "en" ? "Dashavidha Pariksha assessment" : "दशविध परीक्षा"}</span>
        </button>
        <button class="mode-card mode-card--doc" data-mode="__document__" type="button">
          <span class="mode-icon">📄</span>
          <span class="mode-title">${state.lang === "en" ? "Digitize a Document" : "दस्तावेज़ डिजिटाइज़ करें"}</span>
          <span class="mode-desc">${state.lang === "en" ? "Scan a prior prescription or lab report" : "पुराना पर्चा या लैब रिपोर्ट स्कैन करें"}</span>
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll(".mode-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === "__document__") return showDocumentUpload();
      startFlow(btn.dataset.mode);
    });
  });
}

function startFlow(flowId) {
  state.flowId = flowId;
  state.nodeId = FLOWS[flowId].start;
  state.answers = [];
  state.redFlags = [];
  render();
}

// ---------- Router ----------
function render() {
  if (!state.flowId) return showModeSelect();

  const flow = FLOWS[state.flowId];
  const node = flow.nodes[state.nodeId];

  if (node.type === "end") return showSummary(flow);
  if (node.type === "prakriti_result") return showPrakritiResult(flow, node);

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
  } else if (node.type === "number") {
    optionsHtml = `
      <input id="numberInput" class="number-input" type="number" min="0" max="120"
             inputmode="numeric" placeholder="${state.lang === "en" ? "Enter age" : "आयु दर्ज करें"}" />
      <button id="numberNext" class="next-btn" type="button">${state.lang === "en" ? "Continue" : "आगे बढ़ें"}</button>
    `;
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
  } else if (node.type === "number") {
    document.getElementById("numberNext").addEventListener("click", () => {
      const val = document.getElementById("numberInput").value;
      const num = val === "" ? null : Number(val);
      state.answers.push({ question: t(node.text), answer: val === "" ? "—" : val });
      if (num !== null) state.patientAge = num;
      state.nodeId = node.next;
      render();
    });
  }
}

// ---------- Screen: Prakriti result (AYUSH-specific) ----------
function showPrakritiResult(flow, node) {
  const counts = { vata: 0, pitta: 0, kapha: 0 };
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
      <p class="note">${
        state.lang === "en"
          ? "A few more questions will complete the rest of the Dashavidha Pariksha."
          : "कुछ और प्रश्न शेष दशविध परीक्षा को पूर्ण करेंगे।"
      }</p>
      <button id="toNext" class="next-btn" type="button">${state.lang === "en" ? "Continue" : "आगे बढ़ें"}</button>
    </div>
  `;

  document.getElementById("toNext").addEventListener("click", () => {
    state.answers.push({
      question: state.lang === "en" ? "Prakriti (constitution)" : "प्रकृति",
      answer: t(doshaNames[dominant]),
    });
    state.nodeId = node.next;
    render();
  });
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
      ${
        flow.physicianOnlyParams
          ? `<h3 class="physician-only-title">${
              state.lang === "en" ? "Assessed by your physician directly:" : "चिकित्सक द्वारा प्रत्यक्ष रूप से मूल्यांकित:"
            }</h3>
             <ul class="param-list">${flow.physicianOnlyParams.map((p) => `<li>${t(p)}</li>`).join("")}</ul>`
          : ""
      }
      <button id="genFhir" class="next-btn next-btn--secondary" type="button">${
        state.lang === "en" ? "Generate ABDM-ready FHIR record" : "ABDM-तैयार FHIR रिकॉर्ड बनाएं"
      }</button>
      <div id="fhirOutput"></div>
      <button id="restart" class="next-btn" type="button">${state.lang === "en" ? "Done — Back to Start" : "पूर्ण — शुरुआत पर वापस जाएं"}</button>
    </div>
  `;

  document.getElementById("restart").addEventListener("click", showModeSelect);
  document.getElementById("genFhir").addEventListener("click", () => generateFhirBundle(flow));
}

async function generateFhirBundle(flow) {
  const outputEl = document.getElementById("fhirOutput");
  outputEl.innerHTML = `<p class="note">${state.lang === "en" ? "Generating..." : "बनाया जा रहा है..."}</p>`;

  try {
    const res = await fetch("/api/fhir-bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flowTitle: t(flow.title),
        age: state.patientAge,
        answers: state.answers,
        redFlags: state.redFlags,
      }),
    });
    if (!res.ok) throw new Error("Server returned " + res.status);
    const bundle = await res.json();
    outputEl.innerHTML = `
      <p class="note">${
        state.lang === "en"
          ? "Sample FHIR R4 bundle (this is the data shape pushed to ABDM's Health Information Exchange):"
          : "नमूना FHIR R4 बंडल (यह वही डेटा संरचना है जो ABDM को भेजी जाती है):"
      }</p>
      <pre class="fhir-block">${JSON.stringify(bundle, null, 2)}</pre>
    `;
  } catch (err) {
    outputEl.innerHTML = `<p class="note">${
      state.lang === "en" ? "Could not reach the server for this — is app.py running?" : "सर्वर से संपर्क नहीं हो सका — क्या app.py चल रहा है?"
    }</p>`;
  }
}

// ================================================================
// Document digitization (OCR) screen -- separate from the question
// flows above. Uses Tesseract.js (loaded via CDN in index.html) so
// OCR runs fully in the browser -- no image ever leaves the device.
// ================================================================

function showDocumentUpload() {
  screenEl.innerHTML = `
    <div class="doc-screen">
      <h2>${state.lang === "en" ? "Digitize a Document" : "दस्तावेज़ डिजिटाइज़ करें"}</h2>
      <p class="subtitle">${
        state.lang === "en"
          ? "Upload a photo of a prescription or lab report. Processing happens on this device."
          : "पर्चे या लैब रिपोर्ट की फोटो अपलोड करें। प्रोसेसिंग इसी डिवाइस पर होती है।"
      }</p>
      <input id="docFile" type="file" accept="image/*" class="file-input" />
      <p class="hint">${
        state.lang === "en"
          ? "No document handy? Try the included sample:"
          : "दस्तावेज़ नहीं है? शामिल नमूना आज़माएं:"
      } <button id="useSample" class="link-btn" type="button">${state.lang === "en" ? "use sample prescription" : "नमूना पर्चा उपयोग करें"}</button></p>
      <div id="docProgress"></div>
      <div id="docResult"></div>
      <button id="backBtn" class="back-btn" type="button">${state.lang === "en" ? "← Start over" : "← फिर से शुरू करें"}</button>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", showModeSelect);
  document.getElementById("docFile").addEventListener("change", (e) => {
    if (e.target.files[0]) runOcr(e.target.files[0]);
  });
  document.getElementById("useSample").addEventListener("click", () => {
    runOcr("/static/sample_docs/sample_prescription.png");
  });
}

async function runOcr(imageSource) {
  const progressEl = document.getElementById("docProgress");
  const resultEl = document.getElementById("docResult");
  resultEl.innerHTML = "";
  progressEl.innerHTML = `<div class="progress-bar"><div id="ocrProgressFill" class="progress-fill" style="width:0%"></div></div>
                           <p class="note" id="ocrStatus">${state.lang === "en" ? "Starting OCR engine..." : "OCR इंजन शुरू हो रहा है..."}</p>`;

  try {
    const worker = await Tesseract.createWorker("eng", 1, {
      logger: (m) => {
        if (m.status && typeof m.progress === "number") {
          document.getElementById("ocrProgressFill").style.width = Math.round(m.progress * 100) + "%";
          document.getElementById("ocrStatus").textContent = m.status;
        }
      },
    });
    const { data } = await worker.recognize(imageSource);
    await worker.terminate();

    const extracted = extractFields(data.text);
    renderOcrResult(data.text, extracted);
  } catch (err) {
    progressEl.innerHTML = "";
    resultEl.innerHTML = `<p class="note">${state.lang === "en" ? "OCR failed to load — this needs an internet connection the first time (to fetch the OCR engine)." : "OCR लोड नहीं हो सका — पहली बार इसके लिए इंटरनेट चाहिए।"}</p>`;
    console.error(err);
  }
}

// Pulls a date, medicine lines, and lab values out of raw OCR text.
// Deliberately simple, explainable pattern-matching -- not a model --
// because every extracted field is shown to the patient/staff to
// confirm or correct before anything is saved. That confirm step is
// the real safety feature, not the extraction accuracy.
function extractFields(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result = { date: null, medicines: [], labValues: [] };

  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  const medRegex = /^\d*\.?\s*(Tab|Cap|Syp|Inj|Tablet|Capsule|Syrup|Injection)\.?\s+(.+)/i;
  const labRegex = /^([A-Za-z][A-Za-z\s()]*?):\s*([\d.\/]+)\s*([A-Za-z\/%]+)?\s*(?:\(([A-Za-z]+)\))?$/;

  lines.forEach((line) => {
    if (!result.date) {
      const d = line.match(dateRegex);
      if (d) result.date = d[1];
    }
    const med = line.match(medRegex);
    if (med) {
      result.medicines.push(`${med[1]} ${med[2]}`.trim());
      return;
    }
    const lab = line.match(labRegex);
    if (lab && lab[3]) {
      const status = lab[4] || null;
      result.labValues.push({
        name: lab[1].trim(),
        value: lab[2],
        unit: lab[3],
        status,
        abnormal: !!status && status.toLowerCase() !== "normal",
      });
    }
  });

  return result;
}

function renderOcrResult(rawText, extracted) {
  document.getElementById("docProgress").innerHTML = "";
  const resultEl = document.getElementById("docResult");

  const medRows = extracted.medicines
    .map((m, i) => `<div class="field-row"><label>${state.lang === "en" ? "Medicine" : "दवा"} ${i + 1}</label><input type="text" value="${m.replace(/"/g, "&quot;")}" /></div>`)
    .join("") || `<p class="note">${state.lang === "en" ? "No medicines detected — you can add them manually." : "कोई दवा नहीं मिली — आप मैन्युअल रूप से जोड़ सकते हैं।"}</p>`;

  const labRows = extracted.labValues
    .map(
      (l) => `<div class="field-row ${l.abnormal ? "field-row--abnormal" : ""}">
                <label>${l.name}${l.abnormal ? " ⚠" : ""}</label>
                <input type="text" value="${l.value} ${l.unit}${l.status ? " (" + l.status + ")" : ""}" />
              </div>`
    )
    .join("") || `<p class="note">${state.lang === "en" ? "No lab values detected." : "कोई लैब मान नहीं मिला।"}</p>`;

  resultEl.innerHTML = `
    <h3>${state.lang === "en" ? "Confirm extracted details" : "निकाले गए विवरण की पुष्टि करें"}</h3>
    <p class="note">${
      state.lang === "en"
        ? "Check every field below against the original document before saving — OCR can misread text."
        : "सहेजने से पहले नीचे हर फ़ील्ड को मूल दस्तावेज़ से जांचें — OCR गलत पढ़ सकता है।"
    }</p>
    <div class="field-row"><label>${state.lang === "en" ? "Document date" : "दस्तावेज़ की तारीख"}</label><input type="text" value="${extracted.date || ""}" placeholder="${state.lang === "en" ? "not detected" : "नहीं मिली"}" /></div>
    ${medRows}
    ${labRows}
    <details class="raw-text-toggle">
      <summary>${state.lang === "en" ? "View raw OCR text" : "मूल OCR टेक्स्ट देखें"}</summary>
      <pre class="fhir-block">${rawText.replace(/</g, "&lt;")}</pre>
    </details>
    <button id="confirmSave" class="next-btn" type="button">${state.lang === "en" ? "Confirm & Save to Record" : "पुष्टि करें और रिकॉर्ड में सहेजें"}</button>
  `;

  document.getElementById("confirmSave").addEventListener("click", () => {
    resultEl.innerHTML += `<p class="note note--success">✓ ${
      state.lang === "en" ? "Saved to this patient's timeline (demo only — Day 3 wires this into the shared record)." : "मरीज़ की समयरेखा में सहेजा गया (डेमो — यह अगले चरण में पूर्ण रिकॉर्ड से जुड़ेगा)।"
    }</p>`;
  });
}

// Boot the app on the mode-select screen.
showModeSelect();
