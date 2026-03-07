from pydantic import BaseModel

class IndicatorDetail(BaseModel):
    score: float
    details: dict
    weighted_score: float | None = None
    pct_of_max: float | None = None

class StockResult(BaseModel):
    ticker: str
    final_score: float
    grade: str | None = None
    checks: dict[str, IndicatorDetail] 