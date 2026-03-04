from fastapi import FastAPI
from routes.router import router

app = FastAPI(title="Stock Screener API", description="""
## Stock Screener API
Screens NSE-listed equities across major NIFTY indexes using multi-factor technical analysis.

### Features
- 📈 **Swing Trade Scoring** — Weighted score across 11 technical indicators
- 🔐 **API Key Auth** — Secured via `X-API-Key` header
- ⚡ **Redis Caching** — IST-aligned TTL for low-latency responses

### Authentication
All endpoints require a valid API key passed in the request header:
```
X-API-Key: sk-your-key-here
```
    """,
    version="1.0.0",
    # contact={
    #     "name": "Hamzah",
    #     "url": "https://github.com/hamzah",
    # },
    # license_info={
    #     "name": "Private",
    # },
)
app.include_router(router, prefix="/screen")