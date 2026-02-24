from fastapi import FastAPI
from routes.swing import router

app = FastAPI(title="Stock Screener API")
app.include_router(router, prefix="/")