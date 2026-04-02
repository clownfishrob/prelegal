
# Prelegal Project

## Overview

This is a SaaS product that allows users to draft legal agreements based on templates. Users engage in AI chat to determine which document they need and how to populate its fields. Available documents are listed in `catalog.json`.

The current implementation has a Mutual NDA creator with AI chat. Users log in, then chat with an AI that asks about NDA fields and populates the document live. The V1 foundation is in place: FastAPI backend, static Next.js frontend, SQLite auth (register/login with JWT), Docker container, and start/stop scripts. Document persistence is not yet implemented.

## Development Process

When building a feature:
1. Read feature instructions from Jira using Atlassian tools
2. Develop the feature following the 7-step feature-dev process
3. Test thoroughly with unit and integration tests
4. Submit a PR via GitHub

## AI Design

For LLM calls, use LiteLLM via OpenRouter with the `openrouter/openai/gpt-oss-120b` model and Cerebras inference provider. Implement Structured Outputs to interpret results and populate document fields.

Reference the `OPENROUTER_API_KEY` in `.env` at the project root.

## Technical Architecture

- **Containerization**: Single Docker container for entire project
- **Backend**: `backend/` directory, uv project with FastAPI (`pyproject.toml`)
  - Routers: `routers/auth.py` (register/login), `routers/templates.py` (catalog + template content), `routers/chat.py` (AI chat via LiteLLM)
  - Auth dependency: `routers/dependencies.py` (`get_current_user` extracts JWT from Bearer header)
  - Auth: bcrypt password hashing + JWT tokens (`auth.py`)
  - Database: SQLite at `/tmp/prelegal.db`, recreated on each container startup (`database.py`)
  - Serves static frontend from `frontend/out/` with SPA fallback
- **Frontend**: `frontend/` directory, Next.js with `output: "export"` (static build)
  - Fetches templates from `/api/templates/{id}` at runtime (relative URL, same origin)
  - Auth gate: login/register screen, JWT token stored in sessionStorage
  - NdaChat component: AI chat panel that sends messages to `/api/chat` and merges extracted fields into formData
  - NdaPreview: live document preview updated as AI extracts fields
  - Currently only the Mutual NDA creator is implemented
- **API Endpoints**:
  - `POST /api/auth/register` — create user (username 3-50 chars, password 8-128 chars)
  - `POST /api/auth/login` — returns JWT access token
  - `GET /api/templates` — returns catalog.json
  - `GET /api/templates/{id}` — returns template content
  - `POST /api/chat` — JWT-protected; sends conversation to LLM, returns `{ message, fields }` (Cerebras inference via OpenRouter)
- **Scripts**: 
  - `scripts/start-mac.sh` — builds Docker image and starts container
  - `scripts/stop-mac.sh` — stops and removes container
- **URL**: `http://localhost:8000`

## Brand Colors

| Purpose | Color |
|---------|-------|
| Accent | `#ecad0a` (Yellow) |
| Primary | `#209dd7` (Blue) |
| Secondary | `#753991` (Purple) |
| Headings | `#032147` (Dark Navy) |
| Text | `#888888` (Gray) |
