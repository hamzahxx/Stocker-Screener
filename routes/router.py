from fastapi import APIRouter
from screener.data_fetcher import nse_stock_list_fetcher
from screener.scorer import score_stock

router = APIRouter()

@router.get("/swing/{index}")
def screen_index(index: str) -> list:
    print(f"[/swing] Request received for index: {index}")

    try:
        stock_list = nse_stock_list_fetcher(index)
        print(f"[/swing] Stock list fetched — {len(stock_list)} stocks to process")
    except Exception as e:
        print(f"[/swing] ERROR fetching stock list for {index}: {e}")
        return [{"error": f"Failed to fetch stock list: {str(e)}"}]

    results = []
    for i, stock in enumerate(stock_list):
        print(f"[/swing] Processing stock {i+1}/{len(stock_list)}: {stock}")
        try:
            result = score_stock(stock)
            results.append(result)
        except Exception as e:
            print(f"[/swing] ERROR scoring stock {stock}: {e}")
            results.append({"ticker": stock, "error": str(e)})

    results.sort(key=lambda x: x.get("final_score", 0), reverse=True)
    results = [r for r in results if r.get("final_score", 0) >= 50]
    print(f"[/swing] Done. Returning {len(results)} results")
    return results

@router.get("/equity/{stock}")
def screen_stock(stock: str):
    print(f"[/equity] Request received for stock: {stock}")
    try:
        result = score_stock(stock)
        print(f"[/equity] Scoring complete for {stock}")
        return [result]
    except Exception as e:
        print(f"[/equity] ERROR scoring {stock}: {e}")
        return [{"ticker": stock, "error": str(e)}]