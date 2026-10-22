# BrandLedger — Round 2 functional MVP

A **real Django/DRF + PostgreSQL + React** starter for the fictional PayNest demo. It is a scoped deterministic-first implementation, **not** a completed enterprise brand-governance product.

## Quick start

Prerequisites: Python 3.11+, Node.js 20+, Docker Desktop with running Docker engine (or a locally installed PostgreSQL server).

**Terminal 1 (database):**

```bash
docker compose up -d db
```

**Terminal 2 (backend):**

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py seed_demo
python manage.py test core
python manage.py runserver
```

**Terminal 3 (frontend):**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Log in as `creator / creator123!`, create a draft using `Our savings rate is 7%. Returns guaranteed.`, acknowledge or dismiss findings, edit to `Our savings rate is 6.5%. Returns subject to applicable terms.`, save new version. Sign out and log in as `reviewer / reviewer123!` to approve. See the audit history tab.

**Important:** These are intentionally insecure demo credentials. Change them before hosting. Do not use actual client data. For public hosting, restrict access and configure secrets, HTTPS, CORS, allowed hosts, persistent PostgreSQL and a safe authentication policy.

## Working features
- Token-based demo login, creator and staff reviewer
- Approved facts (including superseded facts) and prohibited phrase rules
- Draft submission and deterministic finding generation
- Findings with excerpts, evidence source and suggested wording
- Acknowledge/dismiss findings, revise to a new version, reviewer-only approval
- Audit history for versions and decisions
- Django tests for the central review workflow

## Honest limits and must-fix before production
- The fact checker recognises **explicit key + numeric value** patterns such as `savings rate is 7%`; it is **not** a general semantic claim verifier.
- Rule/fact management currently uses Django admin, not a creator-facing UI.
- No LLM, image/document parsing, accessibility checks or governance dashboard are included.
- Single demo workspace only; all authenticated users can see drafts. This is not multi-tenant isolation.
- Reviewer is currently a staff flag. This is a demo role model, not granular enterprise permissions.
- Demo accounts and passwords must not be exposed publicly as-is; add rate limits and secure authentication before external deployment.
- To deploy to Render, use build command `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput` and start command `gunicorn config.wsgi:application` from backend root; provision PostgreSQL and environment variables. Configure frontend `VITE_API_URL` to the deployed backend `/api` and set backend `FRONTEND_ORIGINS` to the Vercel origin.

## Round 3 improvements (proposed)
1. Source-grounded semantic AI checks for unsupported claims and tone, with structured output and human review of uncertainty.
2. Secure organisation workspaces with granular creator/reviewer/manager permissions, private source uploads and stronger audit controls.
3. Multi-format checks (DOCX/image assets) plus accessible visual/terminology checks and recurring guideline-gap analytics.

These are **planned** improvements, not implemented Round 2 features.
