# MediKiosk — SIH 2026 (PS 26047)

AI-assisted patient case-taking kiosk for Ministry of AYUSH / All India
Institute of Ayurveda. Internal Hackathon: **7 September 2026.**

---

## Day 2 — what's new in this zip

- **Document digitization**: upload a photo of a prescription or lab
  report → OCR runs *in your browser* (Tesseract.js, nothing uploaded
  to any server) → dates, medicines, and lab values get pulled out
  automatically → every field is shown to you to **confirm or correct
  before saving**, with abnormal lab values highlighted in red. A
  clean sample prescription image is included so you can try this
  immediately, no real document needed.
- **The rest of the AYUSH assessment**: after Prakriti, the flow now
  continues through Vikriti (current imbalance), Ahara Shakti
  (digestive strength), Vyayama Shakti (exercise capacity), Satmya
  (compatibility), Satva (mental resilience), and Vaya (age) — six
  more of Dashavidha Pariksha's ten parameters, patient-reportable by
  design. The summary screen now also lists the three that genuinely
  need the physician's own examination (Sara, Samhanana, Pramana),
  instead of faking them as questions.
- **A real FHIR bundle, on demand**: on any summary screen, tap
  "Generate ABDM-ready FHIR record" and the backend builds a real
  HL7 FHIR R4 `Bundle` (Patient, Condition, Observations, and a
  priority Flag if red flags were raised) from exactly what was
  captured — shown on screen as actual JSON, not a claim.

I ran the whole thing end to end again before sending it — homepage,
every static file, the sample image, and the FHIR endpoint all
returned correct responses with no errors.

## How to run this

Same as Day 1 — if your virtual environment is already set up from
yesterday, you only need:
```
venv\Scripts\activate        (Windows)
source venv/bin/activate     (Mac/Linux)
python app.py
```
Then open **http://127.0.0.1:5000**

Starting fresh instead? Full steps are the same as Day 1's README —
`python -m venv venv` → activate → `pip install -r requirements.txt`
→ `python app.py`.

**One real dependency today:** the OCR screen needs an internet
connection *the first time* you use it, to download the OCR engine
from a CDN. After that first load your browser may cache it, but
don't assume it'll work on venue wifi you haven't tested — try the
"use sample prescription" button tonight so it's already loaded
before Monday.

**If anything errors**, paste me the exact terminal or browser
console text — don't guess-fix it, that's how hours disappear this
close to the deadline.

## Push today's work to GitHub

```
git add .
git commit -m "Day 2: OCR digitization, full AYUSH chain, FHIR bundle generation"
git push
```

## What's coming

**Day 3 (Sunday):**
- Wire the OCR-confirmed document into the same patient record as
  the conversation history, so the physician-facing summary shows
  both together — the actual "aha" moment from the problem statement
- Finish the full PPT (I'll draft the slide content with you) using
  everything built so far as evidence, not claims
- Record the demo video
- Rehearse against the questions a judging panel is likely to ask,
  and do a full dry run on whatever device you're presenting with
