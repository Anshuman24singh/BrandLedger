# BrandLedger Frontend Refresh

React + Vite demo frontend with adaptive dark/light themes, Framer Motion transitions, responsive Command Center, interactive Review Studio, evidence-backed finding details, suggested edits, local version history, human decisions, claims ledger, guidelines, guideline-gap insights, and audit timeline.

## Run (Windows PowerShell)
```powershell
npm install
npm run dev
```
Open the Vite URL (usually http://localhost:5173). Use Node.js 18+; Node 20 LTS recommended.

## Django integration
1. Copy `.env.example` to `.env` in this frontend folder.
2. Set `VITE_API_BASE_URL` only after the backend lead confirms the exact API prefix.
3. Adjust endpoint paths and payload/response shapes in `src/lib/api.js` to match the agreed Django REST Framework contract.
4. Allow `http://localhost:5173` in Django CORS settings.
5. Restart Vite after `.env` changes.

Never put `GEMINI_API_KEY`, `DJANGO_SECRET_KEY`, database credentials, or other secrets in a Vite `.env`: browser-visible `VITE_*` values are not secret.

## Important demo limitations
- Without an API URL, deterministic local demo checks power the review flow.
- If the configured API is down, the UI falls back to demo checks.
- Decisions, version history and audit events are local UI state, not durable server records.
- The adapter currently expects `POST /reviews/` and `POST /reviews/:id/decision/`; confirm and update these paths with Anshuman.
- Analytics are illustrative demo data. Do not present them as measured real results.
- A local “Approved” label is not a production approval until the backend persists and authorizes the decision.

## Suggested API payload
```json
{"title":"PayNest Smart Savings — launch campaign","campaign":"Q4 Savings Launch","brand":"PayNest","content":"Draft text..."}
```
Expected review response includes `findings`, each with `id`, `type`, `title`, `detail`, `source`, `severity`, `term`, and `suggestion`.
