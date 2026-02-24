from fastapi import APIRouter
from screener.data_fetcher import nse_stock_list_fetcher

router = APIRouter()

@router.get("/screen/{index}")
def screen_index(index: str):
    results = nse_stock_list_fetcher(index)
    for stock in results:
        print(stock)
    return results