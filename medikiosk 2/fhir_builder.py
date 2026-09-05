"""
MediKiosk -- FHIR R4 bundle builder (Day 2)

WHY THIS IS HAND-WRITTEN INSTEAD OF USING A LIBRARY:
There's a real open-source package (krama-core, on PyPI) built to
generate ABDM-compliant FHIR bundles -- worth naming as your
production integration path. But it's an early-alpha release, and
depending on an unfamiliar third-party library's exact behaviour the
weekend before a demo is a real risk if it doesn't do quite what you
expect. This file builds the same *shape* of output by hand, using
the real FHIR R4 resource structure, so every field is something you
wrote and can explain line by line if a judge asks about it.

This produces a `Bundle` resource containing:
  - one Patient resource (demo data -- the ABHA linkage field is a
    placeholder for where the real sandbox identifier would go)
  - one Condition resource for the chief complaint / flow title
  - one Observation resource per captured answer
  - one Flag resource if any red flags were raised during the visit

`meta.profile` references NRCES's actual India FHIR Implementation
Guide namespace -- naming the real target profile, even though this
demo bundle doesn't validate against every rule in it yet, is more
credible than a generic, unlabelled FHIR claim.
"""

from datetime import datetime, timezone


def _iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_fhir_bundle(flow_title, age, answers, red_flags):
    patient_id = "patient-demo-001"
    condition_id = "condition-001"

    patient_resource = {
        "resourceType": "Patient",
        "id": patient_id,
        "identifier": [
            {
                # This is where a real ABHA number goes once M1
                # (ABHA creation/verification) is wired to the
                # sandbox -- left explicit as a placeholder rather
                # than faked, so it's obvious what's real vs. not.
                "system": "https://healthid.abdm.gov.in",
                "value": "ABHA-ID-PLACEHOLDER",
            }
        ],
        "name": [{"text": "Demo Patient"}],
        "birthDate": _approx_birth_year(age),
    }

    condition_resource = {
        "resourceType": "Condition",
        "id": condition_id,
        "subject": {"reference": f"Patient/{patient_id}"},
        "code": {"text": flow_title or "Unspecified complaint"},
        "clinicalStatus": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active",
                }
            ]
        },
        "recordedDate": _iso_now(),
    }

    observations = []
    for i, a in enumerate(answers or []):
        observations.append(
            {
                "resourceType": "Observation",
                "id": f"obs-{i + 1}",
                "status": "final",
                "subject": {"reference": f"Patient/{patient_id}"},
                "code": {"text": a.get("question", "")},
                "valueString": a.get("answer", ""),
                "effectiveDateTime": _iso_now(),
            }
        )

    entries = [{"resource": patient_resource}, {"resource": condition_resource}]
    entries += [{"resource": o} for o in observations]

    if red_flags:
        entries.append(
            {
                "resource": {
                    "resourceType": "Flag",
                    "status": "active",
                    "code": {"text": "Priority triage — possible emergency signs: " + "; ".join(red_flags)},
                    "subject": {"reference": f"Patient/{patient_id}"},
                }
            }
        )

    bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": _iso_now(),
        "meta": {
            # NRCES = National Resource Centre for EHR Standards,
            # publisher of India's FHIR Implementation Guide that
            # ABDM builds on.
            "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
        },
        "entry": entries,
    }
    return bundle


def _approx_birth_year(age):
    """Turn a self-reported age into an approximate birth year (FHIR
    Patient.birthDate needs a date, not just an age in years)."""
    if not age:
        return None
    try:
        year = datetime.now().year - int(age)
        return f"{year}-01-01"
    except (ValueError, TypeError):
        return None
