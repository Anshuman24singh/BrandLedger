# BrandLedger

**AI-assisted brand compliance review for marketing content.**

BrandLedger helps teams review marketing drafts against brand knowledge before publication. It provides a workflow for content creators to draft and revise content, identify potentially risky claims and wording, and submit content to reviewers for approval.

## 🚀 Live Demo

- **Frontend:** https://brand-ledger-virid.vercel.app/
- **Backend API Health:** https://brandledger-api.onrender.com/api/health/
- **GitHub Repository:** https://github.com/Anshuman24singh/BrandLedger

## ✨ Features

- **Role-based access:** Separate experiences for content creators and reviewers.
- **Draft management:** Create, view, revise, and delete content drafts.
- **Brand compliance checks:** Identify potentially risky phrases and mismatches with known brand facts.
- **Review findings:** Allow reviewers to acknowledge or dismiss findings.
- **Approval workflow:** Enforce backend rules before a draft can be approved.
- **Revision history:** Track changes made to drafts.
- **AI integration:** Groq LLM integration in the Django backend for AI-assisted content review.

*The AI feature should be considered live only after successful verification on the deployed application.*

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, Django |
| API | Django REST Framework |
| LLM integration | Groq API |
| Application server | Gunicorn |
| Static file serving | WhiteNoise |
| Frontend deployment | Vercel |
| Backend deployment | Render |

## 🏗️ Architecture

```text
User
 |
 v
React + Vite Frontend
       (Vercel)
          |
          | HTTPS / REST API
          v
Django REST Framework
        (Render)
          |
          +-- Authentication and permissions
          +-- Draft management and revisions
          +-- Brand knowledge and review findings
          +-- Reviewer decisions and approval rules
          +-- Rule-based review engine
          +-- Groq LLM integration
```

The frontend communicates with the Django backend through REST API endpoints. The backend manages draft data, role permissions, review findings, and approval decisions. LLM requests are handled server-side so the Groq API key is not exposed to the browser.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login/` | Authenticate a user |
| `POST` | `/api/logout/` | Log out |
| `GET` | `/api/health/` | Check backend health |
| `GET` | `/api/knowledge/` | Retrieve brand knowledge |
| `GET` | `/api/drafts/` | List accessible drafts |
| `POST` | `/api/drafts/` | Create a draft |
| `GET` | `/api/drafts/{id}/` | Retrieve a draft |
| `DELETE` | `/api/drafts/{id}/` | Delete a draft |
| `POST` | `/api/drafts/{id}/revise/` | Revise a draft |
| `POST` | `/api/drafts/{id}/findings/{finding_id}/decide/` | Record a reviewer decision |
| `POST` | `/api/drafts/{id}/decide/` | Persist reviewer request-changes or rejection decisions |
| `POST` | `/api/drafts/{id}/approve/` | Approve a draft when requirements are satisfied |

## 💻 Run Locally

### Prerequisites

- Python
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Anshuman24singh/BrandLedger.git
cd BrandLedger
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Copy `.env.example` to `.env` and set a valid `DATABASE_URL`, demo passwords, and `GROQ_API_KEY` if you want AI-assisted review. The demo passwords in the example match the public judge login panel; change both together if you use different credentials.

Activate the environment.

**Windows PowerShell:**

```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

Install dependencies and run the server:

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend will normally be available at `http://127.0.0.1:8000/`.

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a frontend `.env` file containing:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite.

## 🔐 Environment Variables

### Render — Backend

Configure backend environment variables in the Render service settings.

```env
GROQ_API_KEY=your_groq_api_key
```

Use this variable name if the Django code reads `GROQ_API_KEY`. Store the real key in Render's environment settings, never in source code or GitHub.

The configured Render start command is:

```bash
python manage.py migrate --noinput && python manage.py seed_demo && gunicorn config.wsgi:application
```

Set `DEMO_CREATOR_PASSWORD` and `DEMO_REVIEWER_PASSWORD` to values of at least 12 characters in the backend environment. For the public judge demo, these values must match the credentials displayed on the login screen. For a private deployment, change the frontend display and backend environment together, or remove the demo-credential panel. Never commit `.env` files or real API keys.

### Vercel — Frontend

Set the deployed backend URL in the Vercel project environment settings:

```env
VITE_API_BASE_URL=https://brandledger-api.onrender.com/api
```

Redeploy the frontend after changing environment variables.

## 🔒 Security and Permissions

- Keep API keys and secrets in environment variables.
- Do not commit `.env` files or credentials.
- Enforce role permissions and approval rules on the backend.
- Verify that restricted actions are unavailable to unauthorized users.

## 🔮 Future Improvements

- Context-aware AI claim analysis with explanations and safer rewrite suggestions.
- Evidence-grounded retrieval of approved brand facts and policy references.
- Governance analytics for review outcomes, recurring risks, and approval history.

## 🧪 Automated Checks

GitHub Actions runs `python manage.py check`, the Django test suite, and `npm run build` on pushes and pull requests. The workflow uses SQLite for isolated backend tests and does not require a live Groq API key.

## 📄 License

No license has been specified yet.