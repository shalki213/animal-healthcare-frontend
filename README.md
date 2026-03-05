# Animal Diagnosis & Treatment System

A web application for diagnosing and managing animal health conditions. Users can describe symptoms, optionally upload a photo, and receive matched disease results along with treatment recommendations. The frontend is built with plain HTML/CSS/JavaScript and is served by a Node.js/Express backend that persists data in MongoDB and optionally uses Google Gemini vision AI for photo-based analysis.

---

## Features

- **User authentication** – register, log in, and maintain session via JWT
- **Symptom-based diagnosis** – enter symptoms and animal type to get ranked disease matches
- **AI-assisted diagnosis** – upload an animal photo and let Google Gemini Vision identify visible symptoms and the suspected condition
- **Disease guide** – browse the full disease library, filterable by animal type
- **Diagnosis history** – authenticated users can review past diagnosis sessions
- **Rate limiting** – 100 API requests per 15 minutes per IP
- **Render-ready** – `render.yaml` included for one-click cloud deployment

---

## Architecture

```
.                          ← static frontend (HTML / CSS / JS)
├── index.html             ← redirects to home.html
├── home.html              ← landing / auth page
├── diagnosis.html         ← symptom entry & results page
├── guide.html             ← disease guide / library page
├── styles.css
├── script.js              ← shared UI logic
├── guide-script.js        ← guide page logic
├── js/
│   └── api.js             ← centralised fetch() service layer
└── server/                ← Node.js / Express backend
    ├── server.js          ← application entry point
    ├── package.json
    ├── seed.js            ← database seeder
    ├── models/
    │   ├── User.js
    │   ├── Disease.js
    │   └── DiagnosisLog.js
    ├── routes/
    │   ├── auth.js
    │   ├── diseases.js
    │   ├── diagnosis.js
    │   └── upload.js
    └── middleware/
        ├── auth.js
        ├── upload.js
        └── errorHandler.js
```

**Data flow:** The static pages are served by Express from the parent directory (`..`). All dynamic requests go to `/api/*` endpoints on the same origin, authenticated with Bearer JWTs stored in `localStorage`.

---

## Local Setup

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS or later |
| npm | bundled with Node |
| MongoDB | 6 or later (local or Atlas) |

### 1 — Install backend dependencies

```bash
cd server
npm install
```

### 2 — Create the environment file

Create `server/.env` (this file is git-ignored):

```dotenv
# Required
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/animal-healthcare
JWT_SECRET=replace_with_a_long_random_secret

# Optional — token lifetime (default: 7d)
JWT_EXPIRES_IN=7d

# Optional — enables Gemini Vision photo analysis
GEMINI_API_KEY=your_google_gemini_api_key

# Optional — folder for uploaded images (default: uploads)
UPLOAD_DIR=uploads
```

### 3 — Seed the database (optional)

Populate the disease library with sample data:

```bash
cd server
npm run seed
```

### 4 — Start the server

```bash
cd server
npm start
```

The server starts on `http://localhost:5000` by default. For auto-reload during development, run:

```bash
npm run dev
```

### 5 — Open the app

Navigate to **http://localhost:5000/home.html** in your browser.

---

## Frontend Usage Notes

The frontend consists of three main pages:

| Page | URL | Description |
|------|-----|-------------|
| Home | `/home.html` | Register / log in |
| Diagnosis | `/diagnosis.html` | Enter symptoms, upload photo, view results |
| Guide | `/guide.html` | Browse the full disease library |

`js/api.js` contains the `API_BASE_URL` constant that points to the backend:

```js
const API_BASE_URL = 'http://localhost:5000/api';
```

> **Important:** When deploying to a remote host, update this value (or set it dynamically) to match your backend URL. This is a known hardcoded value in the current codebase.

---

## API Overview

All API routes are prefixed with `/api`. Endpoints marked 🔒 require a valid `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` 🔒 | Get the current user's profile |

### Diseases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/diseases` | List all diseases (optional `?animalType=` filter) |
| GET | `/api/diseases/search` | Search by symptoms (`?symptoms=cough,fever&animalType=cow`) |
| GET | `/api/diseases/:id` | Get a single disease by ID |
| POST | `/api/diseases` 🔒 | Add a disease (admin role required) |

### Diagnosis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/diagnosis` 🔒 | Submit a diagnosis request (multipart/form-data: `symptoms`, `animalType`, optional `photo`) |
| GET | `/api/diagnosis/history` 🔒 | Retrieve the current user's past diagnoses |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/photo` 🔒 | Upload an animal photo; returns `photoUrl` |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server liveness check |

---

## Deployment on Render

A `render.yaml` file is included at the repository root for [Render](https://render.com) deployments.

**Required secret environment variables** (set in the Render dashboard under *Environment*):

| Variable | Notes |
|----------|-------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key (optional) |

`JWT_SECRET` is auto-generated by Render. `PORT` and `NODE_ENV` are set automatically by the `render.yaml`.

**Deploy steps:**

1. Fork / push this repository to GitHub.
2. In the Render dashboard, click **New → Blueprint** and connect the repository.
3. Render reads `render.yaml` and creates the web service automatically.
4. Set the required secret env vars in the dashboard.
5. Once deployed, update `API_BASE_URL` in `js/api.js` to your Render service URL (e.g. `https://animal-healthcare-backend.onrender.com/api`).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Cannot connect to server` in the browser | Backend is not running | Run `cd server && npm start` |
| `MongoDB connection failed` on startup | MongoDB not running or wrong URI | Start MongoDB locally or check `MONGODB_URI` in `.env` |
| `JWT_SECRET` not set error | Missing env var | Add `JWT_SECRET` to `server/.env` |
| Photo upload has no AI analysis | `GEMINI_API_KEY` not set | Add key to `server/.env`; symptom text search still works without it |
| `Too many requests` (429) | Rate limit exceeded | Wait 15 minutes or increase the limit in `server.js` |

---

## Security Notes

- `JWT_SECRET` must be a long, random string (at least 64 characters / 256 bits of entropy). Never commit it to source control.
- `MONGODB_URI` credentials should be kept in `.env` (already git-ignored via `server/.gitignore`).
- The `CORS` policy in `server.js` currently allows all origins (`*`). For production, restrict `origin` to your frontend domain.
- Uploaded files are stored on the local filesystem under `server/uploads/`. Ensure this directory has appropriate permissions and is not publicly writable.

---

## Medical Disclaimer

> This application is provided for **educational and informational purposes only**. It is not a substitute for professional veterinary advice, diagnosis, or treatment. Always consult a qualified veterinarian for any animal health concerns.
