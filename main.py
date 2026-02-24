from fastapi import FastAPI
from routes.router import router

app = FastAPI(title="Stock Screener API")
app.include_router(router, prefix="/screen")