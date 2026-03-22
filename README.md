# Stocker | The NSE Screener

Stock Screener is a two-part web app for NSE equities: a FastAPI backend computes multi-factor swing-trade scores and a Next.js frontend lets you screen indexes, filter results, and inspect per-stock indicator breakdowns.

## Live Demo 🌐

[https://stocker.hamzahcodes.in/](https://stocker.hamzahcodes.in/)


## What This Project Does 🚀

- Screens NSE index constituents and ranks them by a 0-100 swing score.
- Exposes API endpoints for both index-wide screening and single-stock analysis.
- Shows score, grade, and indicator-level details in a responsive web UI.
- Uses Redis caching to reduce response time and avoid repeated heavy computations.

## Architecture 🧩

- Frontend app: [frontend/app/page.tsx](frontend/app/page.tsx)
- Equity detail page: [frontend/app/equity/[ticker]/page.tsx](frontend/app/equity/[ticker]/page.tsx)
- API client and request headers: [frontend/lib/api.ts](frontend/lib/api.ts)
- FastAPI app entrypoint: [backend/main.py](backend/main.py)
- API routes: [backend/routes/router.py](backend/routes/router.py)
- Scoring engine: [backend/screener/scorer.py](backend/screener/scorer.py)
- Caching layer: [backend/screener/cache.py](backend/screener/cache.py)

## Tech Stack 🛠️

- Frontend: Next.js 16, React 19, TypeScript, TanStack Query, Jest.
- Backend: FastAPI, Uvicorn, pandas, yfinance, requests, redis, python-dotenv.
- API key storage and validation: Supabase.

See dependencies in [frontend/package.json](frontend/package.json) and [backend/requirements.txt](backend/requirements.txt).

## Quick Start ⚡

1.  Install backend dependencies.

        cd backend
        python3 -m venv .venv
        source .venv/bin/activate
        pip install -r requirements.txt

2.  Create backend .env manually using the Environment Variables section below.

3.  Start backend API.

        uvicorn main:app --reload --host 0.0.0.0 --port 8000

4.  In a new terminal, install and run frontend.

        cd frontend
        npm install
        npm run dev

5.  Open http://localhost:3000 and you are good to go 🎉

## Environment Variables 🔐

Backend variables used by the code:

- SUPABASE_URL: Supabase project URL used for API key table operations.
- SUPABASE_KEY: Supabase service key used by key manager and auth validation.
- REDIS_URL: Optional cloud Redis URL. If omitted, code falls back to local Redis at localhost:6379.

Frontend variables used by the code:

- NEXT_PUBLIC_API_BASE_URL: Backend base URL. Defaults to http://localhost:8000.
- NEXT_PUBLIC_API_KEY: API key sent in X-API-Key request header.

Suggested backend .env:

    	SUPABASE_URL=https://your-project.supabase.co
    	SUPABASE_KEY=your-supabase-service-key
    	REDIS_URL=redis://localhost:6379/0

Suggested frontend .env.local:

    	NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    	NEXT_PUBLIC_API_KEY=sk-your-key

Variable usage references:

- [backend/api_key_manager.py](backend/api_key_manager.py)
- [backend/screener/cache.py](backend/screener/cache.py)
- [frontend/lib/api.ts](frontend/lib/api.ts)
- [frontend/next.config.ts](frontend/next.config.ts)

## API Overview 📡

Base URL (local): http://localhost:8000

All API routes are mounted under /screen in [backend/main.py](backend/main.py).

Endpoints:

- GET /screen/swing/{index}
  Returns a list of stocks in the requested index sorted by final_score descending.
- GET /screen/equity/{stock}
  Returns detailed score and indicator checks for a single stock.

Authentication:

- Header required on all endpoints: X-API-Key: your-key
- Validation logic: [backend/auth.py](backend/auth.py)

Response schema:

- StockResult model: [backend/routes/schemas.py](backend/routes/schemas.py)

## Frontend Behavior 🎨

- Main screener page uses React Query and local filtering/sorting on returned data.
- Detail page at /equity/[ticker] shows grade, score gauge, and metric cards.
- Next.js rewrites proxy browser requests through /api/screener to reduce CORS issues.

Relevant files:

- [frontend/app/page.tsx](frontend/app/page.tsx)
- [frontend/app/equity/[ticker]/page.tsx](frontend/app/equity/[ticker]/page.tsx)
- [frontend/components/IndexSelector.tsx](frontend/components/IndexSelector.tsx)
- [frontend/next.config.ts](frontend/next.config.ts)

## Scoring Methodology 📊

Scoring pipeline:

- Backend runs multiple indicator checks per stock.
- Each weighted check is normalized by its max raw score.
- Weighted contributions are summed and converted to a 0-100 final_score.
- Grade is assigned from final_score thresholds.

Current grade thresholds in [backend/screener/scorer.py](backend/screener/scorer.py):

- A: score >= 80
- B: score >= 65
- C: score >= 50
- D: score >= 35
- F: score < 35

## Data and Caching ⚙️

- Index constituents are fetched from NSE API in [backend/screener/data_fetcher.py](backend/screener/data_fetcher.py).
- OHLCV and metadata come from yfinance in [backend/screener/data_fetcher.py](backend/screener/data_fetcher.py).
- Results are cached in Redis with TTL aligned to next 09:15 IST refresh in [backend/screener/cache.py](backend/screener/cache.py).
- Priority index cache pre-warming script: [backend/scripts/cache_warmer.py](backend/scripts/cache_warmer.py).

## Key Management Utilities 🔑

CLI utility location: [backend/manage_keys.py](backend/manage_keys.py)

Examples:

    	cd backend
    	python manage_keys.py generate my-owner 30
    	python manage_keys.py list
    	python manage_keys.py revoke sk-prefix
    	python manage_keys.py reactivate sk-prefix 30

Key operations implementation: [backend/api_key_manager.py](backend/api_key_manager.py)

## Testing 🧪

Frontend tests:

    	cd frontend
    	npx jest

Jest config: [frontend/jest.config.js](frontend/jest.config.js)
Example test files:

- [frontend/lib/utils.test.ts](frontend/lib/utils.test.ts)
- [frontend/lib/market.test.ts](frontend/lib/market.test.ts)

Backend tests are not yet present in the current repository structure.

## Repository Layout 🗂️

- [backend](backend): API, screener logic, caching, scripts, key management.
- [frontend](frontend): Next.js UI, data fetching, filters, and pages.
- [tasks](tasks): project task and PRD execution notes.
- [rules](rules): markdown workflow/generation rules.
- [citations](citations): attribution and citation notes.

## Troubleshooting 🧯

- 403 Invalid or expired API key:
  Check NEXT_PUBLIC_API_KEY in frontend env and key status in Supabase table.
- API not reachable from frontend:
  Ensure backend is running on NEXT_PUBLIC_API_BASE_URL and check rewrites in [frontend/next.config.ts](frontend/next.config.ts).
- Redis connection failures:
  Set REDIS_URL or run a local Redis instance on 6379.
- Empty or partial index results:
  NSE endpoint or yfinance calls can fail intermittently; retry and review backend logs.

## Status And Next Documentation Steps 🛣️

This README is now a practical project guide for setup, running locally, API usage, scoring, caching, scripts, and tests.

Recommended next additions:

- Add deployment steps for your target platform.
- Add backend automated test suite instructions once tests are added.
- Add license and contribution policy when ready.
