/**
 * Snapshot of FormHug Community Accessibility Survey field definitions.
 * SOURCE: connected FormHug form f50pAQ, inspected 2026-11-09.
 * This is schema metadata ONLY; no respondent submissions or contact details.
 * Do not treat this as survey results, a verified accessibility assessment,
 * or a replacement for Core consent and Access evidence review.
 * Changes in FormHug must be reviewed and versioned before synchronising.
 */
import type { FormHugSurveySchema } from "./types";

export const formHugAccessSurvey: FormHugSurveySchema = {
  "formToken": "f50pAQ",
  "formName": "MapAble | Community Accessibility Survey (pilot)",
  "version": "formhug-2026-11-09",
  "source": "formhug_schema_only",
  "entriesAtInspection": 0,
  "fields": [
    {
      "apiCode": "field_1",
      "type": "page_break",
      "label": "",
      "required": false,
      "choices": [],
      "help": ""
    },
    {
      "apiCode": "field_2",
      "type": "description",
      "label": "Before you begin",
      "required": false,
      "choices": [],
      "help": "Voluntary community feedback about public places and journeys. Avoid names, faces, home addresses, licence plates, health information or details identifying other people. Submissions are observations, not verified access ratings or emergency reports. You can stop before submitting."
    },
    {
      "apiCode": "field_3",
      "type": "radio",
      "label": "Do you agree to submit these observations for internal accessibility review?",
      "required": true,
      "choices": [
        {
          "code": "hjpY",
          "label": "Yes, I agree"
        },
        {
          "code": "X3ej",
          "label": "No, I do not agree"
        }
      ],
      "help": "Choose No to stop. Do not submit if you do not consent. Consent to public sharing is a separate question later."
    },
    {
      "apiCode": "field_4",
      "type": "radio",
      "label": "What are you reporting?",
      "required": true,
      "choices": [
        {
          "code": "8opO",
          "label": "A place or feature"
        },
        {
          "code": "580J",
          "label": "A connected journey or route"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_5",
      "type": "radio",
      "label": "Whose observation is this?",
      "required": true,
      "choices": [
        {
          "code": "kkwD",
          "label": "My own observation"
        },
        {
          "code": "9PCj",
          "label": "Recorded with a supporter I chose"
        },
        {
          "code": "Y1NQ",
          "label": "Shared with the observer's permission"
        },
        {
          "code": "5xgV",
          "label": "Professional/community observer"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_6",
      "type": "checkbox",
      "label": "How are you completing this survey? (optional)",
      "required": false,
      "choices": [
        {
          "code": "r949",
          "label": "Typing"
        },
        {
          "code": "QYN7",
          "label": "AAC or communication aid"
        },
        {
          "code": "ycfK",
          "label": "Voice or speech-to-text"
        },
        {
          "code": "oeWe",
          "label": "With a chosen supporter"
        },
        {
          "code": "wiIa",
          "label": "Other"
        }
      ],
      "help": "This helps us improve access to the survey. No diagnosis is needed."
    },
    {
      "apiCode": "field_7",
      "type": "page_break",
      "label": "Place or journey",
      "required": false,
      "choices": [],
      "help": "Describe a public location. You do not need to disclose your personal location."
    },
    {
      "apiCode": "field_8",
      "type": "short_text",
      "label": "Place or route name",
      "required": true,
      "choices": [],
      "help": ""
    },
    {
      "apiCode": "field_9",
      "type": "short_text",
      "label": "Suburb or locality",
      "required": true,
      "choices": [],
      "help": ""
    },
    {
      "apiCode": "field_10",
      "type": "dropdown",
      "label": "State or territory",
      "required": true,
      "choices": [
        {
          "code": "eAJy",
          "label": "NSW"
        },
        {
          "code": "zLrG",
          "label": "VIC"
        },
        {
          "code": "S69Y",
          "label": "QLD"
        },
        {
          "code": "bcRw",
          "label": "WA"
        },
        {
          "code": "nIQA",
          "label": "SA"
        },
        {
          "code": "LJyk",
          "label": "TAS"
        },
        {
          "code": "YdEH",
          "label": "ACT"
        },
        {
          "code": "jMzz",
          "label": "NT"
        },
        {
          "code": "xhfh",
          "label": "Outside Australia"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_11",
      "type": "dropdown",
      "label": "Place type",
      "required": true,
      "choices": [
        {
          "code": "HJg8",
          "label": "Footpath or crossing"
        },
        {
          "code": "NQyY",
          "label": "Train station or bus stop"
        },
        {
          "code": "SRvU",
          "label": "Park or playground"
        },
        {
          "code": "O6zW",
          "label": "Public building or civic facility"
        },
        {
          "code": "Pajf",
          "label": "Shop, cafe or hospitality"
        },
        {
          "code": "l0Go",
          "label": "Health or community service"
        },
        {
          "code": "AA04",
          "label": "Parking or drop-off"
        },
        {
          "code": "7pN1",
          "label": "Other public place"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_12",
      "type": "date",
      "label": "Date you observed this",
      "required": true,
      "choices": [],
      "help": "Use your best estimate; observations can become outdated."
    },
    {
      "apiCode": "field_13",
      "type": "short_text",
      "label": "Specific area, feature or route segment",
      "required": false,
      "choices": [],
      "help": "Example: western entry door, not the entire venue. No private home details."
    },
    {
      "apiCode": "field_14",
      "type": "short_text",
      "label": "Journey start (public landmark)",
      "required": false,
      "choices": [],
      "help": "Only for a connected journey; don't enter home addresses."
    },
    {
      "apiCode": "field_15",
      "type": "short_text",
      "label": "Journey end (public landmark)",
      "required": false,
      "choices": [],
      "help": "Only for a connected journey; don't enter home addresses."
    },
    {
      "apiCode": "field_16",
      "type": "radio",
      "label": "Would you like to add an exact map location?",
      "required": true,
      "choices": [
        {
          "code": "NRcQ",
          "label": "No, suburb and description are enough"
        },
        {
          "code": "TYOQ",
          "label": "Yes, I choose to provide a public-place pin"
        }
      ],
      "help": "Optional. Precise location may reveal sensitive movement patterns. No auto-location is required."
    },
    {
      "apiCode": "field_17",
      "type": "location",
      "label": "Optional public-place map pin",
      "required": false,
      "choices": [],
      "help": "Only mark the public place being assessed. Never pinpoint someone's home or current private location."
    },
    {
      "apiCode": "field_18",
      "type": "page_break",
      "label": "What did you observe?",
      "required": false,
      "choices": [],
      "help": "Please report specific features, conditions, and experiences. A staff member or trained reviewer may need to check the evidence."
    },
    {
      "apiCode": "field_19",
      "type": "dropdown",
      "label": "Main accessibility feature",
      "required": true,
      "choices": [
        {
          "code": "3m4y",
          "label": "Entrance or doorway"
        },
        {
          "code": "Zohm",
          "label": "Footpath, corridor or surface"
        },
        {
          "code": "6Brq",
          "label": "Kerb ramp or crossing"
        },
        {
          "code": "zQdm",
          "label": "Lift, ramp or stairs"
        },
        {
          "code": "gPkW",
          "label": "Toilet or change facility"
        },
        {
          "code": "T0Im",
          "label": "Parking or drop-off"
        },
        {
          "code": "2piY",
          "label": "Public transport boarding"
        },
        {
          "code": "rbNj",
          "label": "Signage or wayfinding"
        },
        {
          "code": "uz6H",
          "label": "Lighting, sound or sensory setting"
        },
        {
          "code": "RRzA",
          "label": "Communication, AAC or information"
        },
        {
          "code": "kqMy",
          "label": "Online accessibility information"
        },
        {
          "code": "OXJc",
          "label": "Staff assistance or service"
        },
        {
          "code": "4VVU",
          "label": "Other"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_20",
      "type": "radio",
      "label": "What happened when the feature or journey was used or checked?",
      "required": true,
      "choices": [
        {
          "code": "tEKb",
          "label": "It appeared usable without additional assistance"
        },
        {
          "code": "xqVL",
          "label": "It was usable only with a detour, assistance or adjustment"
        },
        {
          "code": "4kkp",
          "label": "It could not be used for the intended purpose"
        },
        {
          "code": "FI6Y",
          "label": "It was not tested or is uncertain"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_21",
      "type": "checkbox",
      "label": "Which barriers or features were relevant?",
      "required": false,
      "choices": [
        {
          "code": "DrOO",
          "label": "Steps, steep slope or uneven ground"
        },
        {
          "code": "AhoO",
          "label": "Narrow or obstructed path"
        },
        {
          "code": "Bcod",
          "label": "Door or threshold difficulty"
        },
        {
          "code": "5B4O",
          "label": "Lift unavailable or unreliable"
        },
        {
          "code": "ySYY",
          "label": "Accessible toilet or parking issue"
        },
        {
          "code": "IfRU",
          "label": "Limited wayfinding or information"
        },
        {
          "code": "ukcw",
          "label": "Communication or AAC barrier"
        },
        {
          "code": "8pSY",
          "label": "Noise, lighting or sensory barrier"
        },
        {
          "code": "ZPyJ",
          "label": "Staff/service barrier"
        },
        {
          "code": "Dmdu",
          "label": "No barrier observed"
        },
        {
          "code": "V7Ui",
          "label": "Other"
        }
      ],
      "help": "Choose any that apply. These describe what mattered, not a diagnosis."
    },
    {
      "apiCode": "field_22",
      "type": "radio",
      "label": "Did access depend on an alternative arrangement?",
      "required": true,
      "choices": [
        {
          "code": "drBF",
          "label": "No additional arrangement observed"
        },
        {
          "code": "rlV0",
          "label": "A detour or alternative route"
        },
        {
          "code": "AId2",
          "label": "Help from another person"
        },
        {
          "code": "CW3p",
          "label": "Equipment or service adjustment"
        },
        {
          "code": "JJen",
          "label": "Not sure"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_23",
      "type": "radio",
      "label": "Was the condition temporary or changeable?",
      "required": true,
      "choices": [
        {
          "code": "SOnt",
          "label": "Temporary or time-sensitive"
        },
        {
          "code": "m4XA",
          "label": "Appeared ongoing"
        },
        {
          "code": "ndjP",
          "label": "Not sure"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_24",
      "type": "radio",
      "label": "Did you notice a possible urgent hazard?",
      "required": true,
      "choices": [
        {
          "code": "gV12",
          "label": "Yes - possible urgent hazard"
        },
        {
          "code": "jiGK",
          "label": "No urgent hazard noticed"
        },
        {
          "code": "AzNk",
          "label": "Not sure"
        }
      ],
      "help": "This survey is not monitored as an emergency channel. Contact the relevant service or emergency services directly if someone is in immediate danger."
    },
    {
      "apiCode": "field_25",
      "type": "long_text",
      "label": "Describe the observation in your own words (optional)",
      "required": false,
      "choices": [],
      "help": "What was observed? What was usable or unusable? Include limitations or alternative access. Type using your preferred method, including AAC."
    },
    {
      "apiCode": "field_26",
      "type": "radio",
      "label": "How was this information obtained?",
      "required": true,
      "choices": [
        {
          "code": "7vrP",
          "label": "Directly observed"
        },
        {
          "code": "cZDm",
          "label": "Measured with a tool"
        },
        {
          "code": "FLL6",
          "label": "Reported by another person"
        },
        {
          "code": "q4kZ",
          "label": "Seen in a published source or online"
        },
        {
          "code": "FKV1",
          "label": "Not sure"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_27",
      "type": "number",
      "label": "Clear path or doorway width, in millimetres (optional)",
      "required": false,
      "choices": [],
      "help": "Enter only if measured. Do not guess; a number alone is not a compliance decision."
    },
    {
      "apiCode": "field_28",
      "type": "attachment",
      "label": "Supporting photos or documents (optional)",
      "required": false,
      "choices": [],
      "help": "Only upload material you have permission to share. Remove faces, private details, number plates and identifying metadata first."
    },
    {
      "apiCode": "field_29",
      "type": "audio",
      "label": "Optional voice description (up to 2 minutes)",
      "required": false,
      "choices": [],
      "help": "If voice is easier, you can add a recording instead of a long written description. Avoid sharing private details."
    },
    {
      "apiCode": "field_30",
      "type": "page_break",
      "label": "Your choices and submission",
      "required": false,
      "choices": [],
      "help": "You remain in control of whether your observation may be considered for a de-identified public report."
    },
    {
      "apiCode": "field_31",
      "type": "radio",
      "label": "May MapAble consider a de-identified version of this observation for public reporting?",
      "required": true,
      "choices": [
        {
          "code": "8WfI",
          "label": "No - internal review only"
        },
        {
          "code": "lDLp",
          "label": "Yes - consider it after review"
        }
      ],
      "help": "Public reporting would require human review, removal of identifying details, source/date/context and an appropriate publication decision. Saying Yes does not guarantee publication."
    },
    {
      "apiCode": "field_32",
      "type": "radio",
      "label": "May the survey team contact you to clarify or correct this observation?",
      "required": true,
      "choices": [
        {
          "code": "eWlf",
          "label": "No, please do not contact me"
        },
        {
          "code": "oZ55",
          "label": "Yes, I would like optional follow-up"
        }
      ],
      "help": ""
    },
    {
      "apiCode": "field_33",
      "type": "email",
      "label": "Email for follow-up (only if you chose Yes)",
      "required": false,
      "choices": [],
      "help": "Optional. Never shown on public reports. Do not enter someone else's email without permission."
    },
    {
      "apiCode": "field_34",
      "type": "description",
      "label": "Thank you for contributing",
      "required": false,
      "choices": [],
      "help": "Submitted observations require review before they are used for public accessibility claims. A Green label is never a guarantee for every person, and Unknown is not assumed accessible. If a safety issue needs immediate attention, report it directly to the responsible authority."
    }
  ],
  "rules": [
    {
      "kind": "abort",
      "ifField": "field_3",
      "equals": "X3ej",
      "targets": []
    },
    {
      "kind": "show",
      "ifField": "field_4",
      "equals": "580J",
      "targets": [
        "field_14",
        "field_15"
      ]
    },
    {
      "kind": "show",
      "ifField": "field_16",
      "equals": "TYOQ",
      "targets": [
        "field_17"
      ]
    },
    {
      "kind": "show",
      "ifField": "field_32",
      "equals": "oZ55",
      "targets": [
        "field_33"
      ]
    }
  ]
};
