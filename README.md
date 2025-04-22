# 🧠 Mind Map Generator

The **Mind Map Generator** is a backend service that reads a list of subjects and topics, generates subtopics using OpenAI's LLM, and stores the results in **Google Firestore**. It also logs the status of each topic in a CSV file, with optional support for **Google Cloud Storage (GCS)**.

---

## 🚀 Features

- Generate mind maps via OpenAI LLM
- Store results in Firestore
- Support both local and GCS CSV input/output
- Token-based authentication (OAuth2-ready)
- Cloud Run deployment ready

---

## 📦 Prerequisites

- **Node.js**: `v18.17.0`
- **npm**: `v9.6.7`
- **TypeScript**: `v5.4.3`

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd mindmap-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root of the project:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google Cloud Project
GCP_PROJECT_ID={gcp_project_id}

# Server
PORT=8080

# GCS Configuration
USE_GCS=true                      # Set to false to use local CSVs
CSV_BUCKET={gcs_bucket}

# Auth Configuration
USE_AUTH=true                    # Set to false to disable token check
API_SECRET_TOKEN=your_secret_token  # To be replaced with OAuth2
```

---

## 🛠 Build & Run

### Build the app:

```bash
npm run build
```

### Start the server:

```bash
npm run start
```

---

## ☁️ Deployed Instance (GCP)

```
https://mindmap-831803728153.europe-west10.run.app
```

> ⚠️ **Note:** This is a backend URL — do not expose it directly in the frontend.

---

## 📡 API Endpoints

### `POST /generate`

Generate subtopics for given subject/topic pairs from a CSV input.

### `GET /mindmaps`

Returns the list of all generated mind maps.
