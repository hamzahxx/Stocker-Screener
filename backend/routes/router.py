from fastapi import APIRouter, Depends, HTTPException
from routes.schemas import StockResult
from screener.data_fetcher import nse_stock_list_fetcher
from screener.scorer import score_stock
from auth import verify_api_key
import concurrent.futures

router = APIRouter()

@router.get(
    "/swing/{index}",
    summary="Screen an NSE Index",
    description="Returns all stocks in the given index ranked by swing trade score (0-100).",
    response_description="List of stocks sorted by final score descending",
    response_model=list[StockResult],
    tags=["Screener"],
)
def screen_index(index: str, api_key: str = Depends(verify_api_key)) -> list:
    print(f"[/swing] Request received for index: {index}")

    try:
        stock_list = nse_stock_list_fetcher(index)
        print(f"[/swing] Stock list fetched — {len(stock_list)} stocks to process")
    except Exception as e:
        print(f"[/swing] ERROR fetching stock list for {index}: {e}")
        raise HTTPException(status_code=400, detail="NSE data not found")

    results = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(score_stock, stock) for stock in stock_list]
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"[/swing] ERROR scoring stocks: {e}")

    results.sort(key=lambda x: x.get("final_score", 0), reverse=True)
    print(f"[/swing] Done. Returning {len(results)} results")
    return results

@router.get(
    "/equity/{stock}",
    summary="Screen a Single Stock",
    description="Returns a detailed technical breakdown and score for a single NSE stock.",
    response_description="Score and indicator details for the requested stock",
    response_model=StockResult,
    tags=["Screener"],
)
def screen_stock(stock: str, api_key: str = Depends(verify_api_key)):
    print(f"[/equity] Request received for stock: {stock}")
    try:
        result = score_stock(stock)
        print(f"[/equity] Scoring complete for {stock}")
        return result
    except Exception as e:
        print(f"[/equity] ERROR scoring {stock}: {e}")
        raise HTTPException(status_code=500, detail=str(e))