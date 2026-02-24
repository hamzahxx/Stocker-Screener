from fastapi import APIRouter
from screener.data_fetcher import nse_stock_list_fetcher
from screener.scorer import score_stock

router = APIRouter()

@router.get("/swing/{index}")
def screen_index(index: str) -> list:
    stock_list = nse_stock_list_fetcher(index)
    results = []
    for stock in stock_list:
        try:
            result = score_stock(stock)
            results.append(result)
        except Exception as e:
            results.append({"ticker": stock, "error": str(e)})

    results.sort(key=lambda x: x.get("total_score", 0), reverse=True)
    return results