"""
Pre-warms Redis cache for priority indexes.

Locally:  python -m scripts.cache_warmer
Render:   runs automatically on startup via main.py
"""
from screener.cache import PRIORITY_INDEXES
from screener.data_fetcher import nse_stock_list_fetcher
from screener.scorer import score_stock
import concurrent.futures

def prewarm():
    print("=" * 50)
    print("[prewarm] Starting cache pre-warm")
    print(f"[prewarm] Indexes to warm: {PRIORITY_INDEXES}")
    print("=" * 50)

    total_stocks = 0
    failed_stocks = []

    for index in PRIORITY_INDEXES:
        print(f"\n[prewarm] ── Index: {index}")
        try:
            stocks = nse_stock_list_fetcher(index)
            print(f"[prewarm] {len(stocks)} stocks found")
        except Exception as e:
            print(f"[prewarm] ERROR fetching index {index}: {e}")
            continue
    
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(score_stock, ticker, force_refresh=True): ticker
                for ticker in stocks
            }
            for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
                ticker = futures[future]
                print(f"[prewarm] [{i}/{len(stocks)}] {ticker}")
                try:
                    future.result()
                    total_stocks += 1
                except Exception as e:
                    print(f"[prewarm] ERROR for {ticker}: {e}")
                    failed_stocks.append(ticker)

    print("\n" + "=" * 50)
    print(f"[prewarm] Done.")
    print(f"[prewarm] Successfully cached: {total_stocks} stocks")
    if failed_stocks:
        print(f"[prewarm] Failed ({len(failed_stocks)}): {failed_stocks}")
    print("=" * 50)

if __name__ == "__main__":
    prewarm()