# MediKiosk — SIH 2026 (PS 26047)

AI-assisted patient case-taking kiosk for Ministry of AYUSH / All India
Institute of Ayurveda. Internal Hackathon: **7 September 2026.**

---

## Day 1 — what's in this zip

- A working Flask app with a patient-facing kiosk screen
- A reusable **question engine** (`static/js/app.js`) that walks through
  any branching question flow described in `static/js/questions.js` —
  the engine has zero medical content itself, so adding a new flow
  later is a data change, not a rewrite
- Two flows already working end-to-end, tap to try both:
  - **General Consultation** — chest pain, using the SOCRATES history
    framework doctors are trained on, with rule-based red-flag
    detection (try answering "suddenly", "crushing", and "shortness
    of breath" to see the alert banner)
  - **AYUSH Consultation** — a Prakriti (constitution) self-assessment,
    the first of Ayurveda's ten-fold Dashavidha Pariksha
- Full English/Hindi toggle — top-right button, switches every screen
  instantly, no server call needed
- A clean summary screen — this is what a physician would actually see

I ran and tested this end to end before sending it to you: the server
starts clean, every file loads, and there are no syntax errors.

## How to run this (step by step)

1. **Install Python 3.10+** if you don't have it already:
   https://www.python.org/downloads/ — on Windows, tick **"Add Python
   to PATH"** during install, or the next steps won't find it.
2. Open a terminal (Command Prompt / PowerShell / Terminal) **inside
   this folder.**
3. Create a virtual environment — this keeps this project's packages
   separate from everything else on your machine, so nothing here can
   break:
   ```
   python -m venv venv
   ```
4. Activate it:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
   (You'll see `(venv)` appear at the start of your terminal line —
   that means it worked.)
5. Install the one dependency this needs:
   ```
   pip install -r requirements.txt
   ```
6. Run it:
   ```
   python app.py
   ```
7. Open your browser to **http://127.0.0.1:5000**

Next time you sit down to work on this, you only need steps 4, 6, 7 —
no need to reinstall anything.

**If something breaks:** copy the exact error text from your terminal
and send it to me — don't try to guess-fix it, a beginner debugging
blind is how hours disappear. I'll tell you exactly what's wrong.

## Push today's work to GitHub

If this is your very first commit:
```
git init
git add .
git commit -m "Day 1: kiosk engine, general + AYUSH prakriti flow"
git branch -M main
git remote add origin <your-empty-GitHub-repo-URL>
git push -u origin main
```

If you already have the repo set up, just unzip this over your
existing folder (overwrite when asked), then:
```
git add .
git commit -m "Day 1: kiosk engine, general + AYUSH prakriti flow"
git push
```

## What's coming

- **Day 2 (Saturday):** document upload + OCR digitization, the
  remaining Dashavidha Pariksha parameters, a real sample ABDM-ready
  FHIR bundle generated from captured data
- **Day 3 (Sunday):** wiring everything into one flow, the full PPT,
  the demo video, rehearsal
