# Environment

All CareOS flags are listed in `.env.example`. Start with
`MAPABLE_CAREOS_ENABLED=false` and `MAPABLE_AI_ENABLED=false`. The system
remains usable through standard forms when both are false.

`OPENAI_API_KEY` and `MAPABLE_CAREOS_MODEL` are optional; model use remains
disabled without valid flags and credentials. Deployment uses the existing
Vercel/Neon arrangement. Migrations must use `DIRECT_URL`; runtime uses the
pooled database URL.
