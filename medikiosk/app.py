"""
MediKiosk -- SIH 2026, PS 26047 (Ministry of AYUSH / AIIA)
Day 1: Flask app that serves the kiosk UI.

WHAT THIS FILE DOES (read this if Flask is new to you):
- Flask is a small Python web server framework: it listens for a
  browser asking for a page, and decides what to send back.
- Today we only need ONE page -- the kiosk screen itself. Everything
  that happens after the page loads (questions, branching logic,
  language switching) is handled by JavaScript in the browser, so
  Python's only job right now is "hand over the page."
- Day 2 will add real routes here: one to receive an uploaded
  prescription image (OCR) and one to generate a sample FHIR bundle.
"""

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def kiosk():
    """The patient-facing kiosk screen. This is the only page for now."""
    return render_template("index.html")


if __name__ == "__main__":
    # debug=True auto-reloads the page whenever you save a file -- great
    # while you're learning and iterating. Turn this off before the
    # real demo on Monday (change to debug=False).
    app.run(debug=True, port=5000)
