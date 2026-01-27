
worldbridger/
│
├── public/
│   │
│   ├── index.html
│   │   → Welcome funnel / explainer homepage
│   │
│   ├── styles.css
│   │   → Local Tailwind-style utility CSS (no build step)
│   │
│   ├── main.js
│   │   → Vanilla JS: joins, group selection, admin helpers
│   │
│   ├── admin.html
│   │   → Lightweight admin panel (groups, moderation)
│   │
│   ├── groups/
│   │   │
│   │   ├── creative.html
│   │   │   → Creative Media & Culture working group
│   │   │
│   │   ├── engineering.html
│   │   │   → Humanitarian & Environmental Engineering
│   │   │
│   │   ├── education.html
│   │   │   → Informal Education & Curriculum
│   │   │
│   │   ├── citizen-science.html
│   │   │   → Citizen Science & Community Data
│   │   │
│   │   └── platform.html
│   │       → Platform & Open Tools
│   │
│   ├── projects/
│   │   │
│   │   ├── citizen-science/
│   │   │   │
│   │   │   ├── index.html
│   │   │   │   → Overview of citizen science projects
│   │   │   │
│   │   │   ├── solar-heating.html
│   │   │   │   → Solar heating & passive thermal experiments
│   │   │   │
│   │   │   ├── rocket-stoves.html
│   │   │   │   → Clean cooking & rocket stove designs
│   │   │   │
│   │   │   ├── water-mapping.html
│   │   │   │   → Mapping water systems & cross-connections
│   │   │   │
│   │   │   ├── plastics-upcycling.html
│   │   │   │   → Reuse & upcycling of plastics
│   │   │   │
│   │   │   └── policy-pressure.html
│   │   │       → Corp / government pressure & biodiversity policy
│   │   │
│   │   ├── creative/
│   │   │   └── index.html
│   │   │       → (Scaffold only — projects TBD)
│   │   │
│   │   ├── engineering/
│   │   │   └── index.html
│   │   │       → (Scaffold only — projects TBD)
│   │   │
│   │   ├── education/
│   │   │   └── index.html
│   │   │       → (Scaffold only — projects TBD)
│   │   │
│   │   └── platform/
│   │       └── index.html
│   │           → (Scaffold only — projects TBD)
│   │
│   └── assets/
│       ├── icons/
│       └── images/
│           → Optional static assets (web-safe by default)
│
├── api/
│   │
│   ├── join.js
│   │   → Join network endpoint (user intake)
│   │
│   ├── messages.js
│   │   → Group message feed + admin moderation
│   │
│   ├── groups.js
│   │   → Working group registry (admin managed)
│   │
│   └── projects.js
│       → (Future) project metadata, artifacts, status
│
├── vercel.json
│   → Vercel serverless configuration
│
├── generate_worldbridger.pl
│   → Perl scaffold generator (safe to re-run)
│
└── README.md
    → Philosophy, contribution guide, local dev notes

